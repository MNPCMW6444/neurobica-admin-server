const express = require("express");
const webpush = require("web-push");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { google } = require("googleapis");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyparser = require("body-parser");
const Item = require("./models/itemModel");
const Task = require("./models/taskModel");
const User = require("./models/userModel");
const Time = require("./models/timeModel");
const TTime = require("./models/ttimeModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { tasks } = require("googleapis/build/src/apis/tasks");
const sgMail = require("@sendgrid/mail");
const Twilio = require("twilio");

const vapidDetails = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
  subject: process.env.VAPID_SUBJECT,
};
dotenv.config();

// setup express server

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["https://admin.flexboxtorchy.com", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(cookieParser());

const PORT = process.env.PORT || 5051;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// set up routers

// connect to mongoDB

mongoose.connect(
  process.env.MDB_CONNECT_STRING,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) return console.error(err);
    console.log("Connected to MongoDB");
  }
);

app.get("/loggedIn", async (req, res) => {
  try {
    const token = req.params.t;

    if (!token) return res.status(400).json({ errorMessage: "אינך מחובר" });

    const validatedUser = jwt.verify(token, process.env.JWTSECRET);

    const userr = await User.findById(validatedUser.user);

    res.json(userr);
  } catch (err) {
    console.log(err);
    return res.status(400).json({ errorMessage: "אינך מחובר" });
  }
});

app.post("/status", async (req, res) => {
  try {
    const token = removeFirstWord(req.body.headers.Authorization);

    if (!token) return res.status(400).json({ errorMessage: "אינך מחובר" });

    const { id } = req.body;

    const editItem = await Task.findById(id);

    editItem.status++;

    const savedItem = await editItem.save();

    res.json(savedItem);
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

app.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password)
      return res.status(400).json({ errorMessage: "שם או סיסמה לא התקבלו" });

    const existingUser = await User.findOne({ name });
    if (!existingUser)
      return res.status(401).json({ errorMessage: "משתמש לא קיים" });

    if (!existingUser.passwordHash)
      return res
        .status(401)
        .json({ errorMessage: "סיסמתך שגויה כי אינה קיימת" });

    const passwordCorrect = await bcrypt.compare(
      password,
      existingUser.passwordHash
    );
    if (!passwordCorrect)
      return res.status(401).json({ errorMessage: "סיסמתך שגויה" });

    const token = jwt.sign(
      {
        user: existingUser._id,
      },
      process.env.JWTSECRET
    );

    res.setHeader("x-access-token", token);
    res
      .cookie("token", token, {
        httpOnly: true,
        sameSite:
          process.env.NODE_ENV === "development"
            ? "lax"
            : process.env.NODE_ENV === "production" && "none",
        secure:
          process.env.NODE_ENV === "development"
            ? false
            : process.env.NODE_ENV === "production" && true,
      })
      .send(
        { accessToken: token } ///////////////
      );
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

app.get("/logout", (req, res) => {
  res
    .cookie(params, {
      httpOnly: true,
      sameSite:
        process.env.NODE_ENV === "development"
          ? "lax"
          : process.env.NODE_ENV === "production" && "none",
      secure:
        process.env.NODE_ENV === "development"
          ? false
          : process.env.NODE_ENV === "production" && true,
      expires: new Date(0),
    })
    .send();
});
/* 
app.put("/changemypass", async (req, res) => {
  try {
    const { iMA } = req.body;

    let token;
    try {
      token = removeFirstWord(req.headers.authorization);
    } catch (e) {}
    if (!token)
      token = req.headers.cookies.substring(6, req.headers.cookie.length);

    if (!token) return res.status(400).json({ errorMessage: "אינך מחובר" });

    const validatedUser = jwt.verify(token, process.env.JWTSECRET);

    const userr = await User.findById(validatedUser.user);

    const { dereg, pass, pass2 } = req.body;

    if (pass.length < 1)
      return res.status(400).json({
        errorMessage: "לא ניתן להשתמש בסיסמה ריקה",
      });

    if (pass !== pass2)
      return res.status(400).json({
        errorMessage: "סיסמאות לא תואמות",
      });

    const salt = await bcrypt.genSalt();
    const ph = await bcrypt.hash(pass, salt);

    userr.passwordHash = ph;

    if (dereg) userr.Dereg = dereg;

    const saveduserr = await userr.save();

    res.json({ SUC: "YES" });
  } catch (err) {
    console.log(err);
    console.error(err);
    res.status(500).send();
  }
}); */
function removeFirstWord(str) {
  if (!str) return "";
  const indexOfSpace = str.indexOf(" ");

  if (indexOfSpace === -1) {
    return "";
  }

  return str.substring(indexOfSpace + 1);
}

app.get("/all", async (req, res) => {
  try {
    let token;
    try {
      token = removeFirstWord(req.headers.authorization);
    } catch (e) {}
    if (!token)
      token = req.headers.cookies.substring(6, req.headers.cookie.length);

    if (!token) return res.status(400).json({ errorMessage: "אינך מחובר" });

    const validatedUser = jwt.verify(token, process.env.JWTSECRET);

    async function userrr(id) {
      const e = await User.findById(id);

      return e.name;
    }

    let items = await Item.find();
    let newi;
    let resa = new Array();
    for (let i = 0; i < items.length; i++) {
      let userr = await User.findById(validatedUser.user);
      newi = items[i].toObject();
      newi.owner = await userrr(items[i].owner);
      resa.push(newi);
    }
    res.json(resa);
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

app.get("/all2", async (req, res) => {
  try {
    async function userrr(id) {
      const e = await User.findById(id);

      return e.name;
    }

    let items = await Item.find();
    let newi;
    let resa = new Array();
    for (let i = 0; i < items.length; i++) {
      newi = items[i].toObject();
      newi.owner = await userrr(items[i].owner);
      resa.push(newi);
    }
    res.json(resa);
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

app.get("/myname", async (req, res) => {
  try {
    let token;
    try {
      token = removeFirstWord(req.headers.authorization);
    } catch (e) {}
    if (!token)
      token = req.headers.cookies.substring(6, req.headers.cookie.length);

    if (!token) return res.status(400).json({ errorMessage: "אינך מחובר" });

    const validatedUser = jwt.verify(token, process.env.JWTSECRET);

    const e = await User.findById(validatedUser.user);

    res.json({ itis: e.name });
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

app.post("/publish", async (req, res) => {
  try {
    let token;
    try {
      token = removeFirstWord(req.headers.authorization);
    } catch (e) {}
    if (!token)
      token = req.headers.cookies.substring(6, req.headers.cookie.length);

    if (!token) return res.status(400).json({ errorMessage: "אינך מחובר" });

    const { desc, time } = req.body;

    const validatedUser = jwt.verify(token, process.env.JWTSECRET);
    const userr = await User.findById(validatedUser.user);

    sgMail.setApiKey(
      "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" //Very-Sensitive
    );
    const msg = {
      to: "founders@neurobica.online", // Change to your recipient
      from: "service@neurobica.online", // Change to your verified sender
      subject: "A new publicaition was made by " + userr.name,
      text: desc,
      html: "<h1>The Content:</h1><p>" + desc + "</p>",
    };
    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
      })
      .catch((error) => {
        console.error(error);
      });

    if (!desc)
      return res.status(400).json({
        errorMessage: "חסר תוכן",
      });

    const newItem = new Item({
      owner: validatedUser.user,
      desc: desc,
      sign1: false,
      sign2: false,
      sign3: false,
      time: time,
    });

    switch (userr.name) {
      case "Michael":
        newItem.sign2 = true;
        break;
      case "Yoad":
        newItem.sign1 = true;
        break;
      case "Daniel":
        newItem.sign3 = true;
        break;
      default:
        break;
    }

    const savedItem = await newItem.save();
    try {
      const headers = {};
      headers["Content-Type"] = "application/json";
      headers["Authorization"] = `Bearer ${await getAccessToken()}`;
      //console.log(headers);
      const usersss = await User.find();
      for (let i = 0; i < usersss.length; i++) {
        if (usersss[i].token)
          for (let j = 0; j < usersss[i].token.length; j++) {
            /* axios
              .post(
                "https://fcm.googleapis.com/v1/projects/neurobica-admin/messages:send",
                {
                  message: {
                    token: usersss[i].token[j],
                    notification: {
                      title: "New R&S!",
                      body: userr.name + " has published a new R&S!",
                    },
                  },
                },
                {
                  headers: headers,
                }
              )
              .then((response) => {
                console.log(response.data);
              })
              .catch((error) => {
                console.log(error);
              }); */
          }
      }
    } catch (e) {}
    res.json(savedItem);
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

app.post("/sign", async (req, res) => {
  try {
    let token;
    try {
      token = removeFirstWord(req.headers.authorization);
    } catch (e) {}
    if (!token)
      token = req.headers.cookies.substring(6, req.headers.cookie.length);

    if (!token) return res.status(400).json({ errorMessage: "אינך מחובר" });

    const { id } = req.body;
    const validatedUser = jwt.verify(token, process.env.JWTSECRET);
    const userr = await User.findById(validatedUser.user);
    const pubb = await Item.findById(id);

    switch (userr.name) {
      case "Michael":
        pubb.sign2 = true;
        break;
      case "Yoad":
        pubb.sign1 = true;
        break;
      case "Daniel":
        pubb.sign3 = true;
        break;
      default:
        break;
    }
    const savedItem = await pubb.save();

    /* try {
      const headers = {};
      headers["Content-Type"] = "application/json";
      headers["Authorization"] = `Bearer ${await getAccessToken()}`;
      //console.log(headers);
      const usersss = await User.find();
      for (let i = 0; i < usersss.length; i++) {
        if (usersss[i].token)
          for (let j = 0; j < usersss[i].token.length; j++) {
            axios
              .post(
                "https://fcm.googleapis.com/v1/projects/neurobica-admin/messages:send",
                {
                  message: {
                    token: usersss[i].token[j],
                    notification: {
                      title: "New R&S!",
                      body: userr.name + " has published a new R&S!",
                    },
                  },
                },
                {
                  headers: headers,
                }
              )
              .then((response) => {
                console.log(response.data);
              })
              .catch((error) => {
                console.log(error);
              });
          }
      }
    } catch (e) {} */
    res.json(savedItem);
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

app.post("/start", async (req, res) => {
  try {
    let token;
    try {
      token = removeFirstWord(req.headers.authorization);
    } catch (e) {}
    if (!token)
      token = req.headers.cookies.substring(6, req.headers.cookie.length);

    if (!token) return res.status(400).json({ errorMessage: "אינך מחובר" });
    const type = req.body.type;

    const neww = new TTime({
      startorstop: true,
      type: type,
      when: new Date(),
    });

    const newww = await neww.save();

    res.json(newww);
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

app.post("/stop", async (req, res) => {
  try {
    let token;
    try {
      token = removeFirstWord(req.headers.authorization);
    } catch (e) {}
    if (!token)
      token = req.headers.cookies.substring(6, req.headers.cookie.length);

    if (!token) return res.status(400).json({ errorMessage: "אינך מחובר" });
    const type = req.body.type;
    const neww = new TTime({
      startorstop: false,
      type: type,
      when: new Date(),
    });

    const newww = await neww.save();

    res.json(newww);
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

app.post("/notify", async (req, res) => {
  try {
    const { token2 } = req.body;
    let token;
    try {
      token = removeFirstWord(req.headers.authorization);
    } catch (e) {}
    if (!token)
      token = req.headers.cookies.substring(6, req.headers.cookie.length);
    if (!token) return res.status(400).json({ errorMessage: "אינך מחובר" });
    const validatedUser = jwt.verify(token, process.env.JWTSECRET);

    const userr = await User.findById(validatedUser.user);

    let tokenar;
    if (userr.token) {
      tokenar = userr.token;
      let flag = true;
      for (let i = 0; i < tokenar.length; i++) {
        if (tokenar[i].substring(0, 20) === token2.substring(0, 20))
          flag = false;
      }
      if (flag) tokenar.push(token2);
      userr.token = tokenar;
    } else userr.token = new Array(token2);

    const savedItem = await userr.save();

    res.json(savedItem);
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

app.post("/savenewtask", async (req, res) => {
  try {
    const token = removeFirstWord(req.body.headers.Authorization);

    if (!token) return res.status(400).json({ errorMessage: "אינך מחובר" });

    const validatedUser = jwt.verify(token, process.env.JWTSECRET);

    const userr = await User.findById(validatedUser.user);

    const { name, desc } = req.body;

    const newitem = new Task({
      isDeleted: false,
      owner: userr,
      name: name,
      desc: desc,
      status: 0,
      children: new Array(),
    });

    const savedItem = await newitem.save();

    res.json(savedItem);
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

app.post("/savesub", async (req, res) => {
  try {
    const token = removeFirstWord(req.body.headers.Authorization);

    if (!token) return res.status(400).json({ errorMessage: "אינך מחובר" });

    const validatedUser = jwt.verify(token, process.env.JWTSECRET);

    const userr = await User.findById(validatedUser.user);

    const { name, desc, parentId } = req.body;

    const newitem = new Task({
      isDeleted: false,
      owner: userr,
      name: name,
      desc: desc,
      parentId: parentId,
      children: new Array(),
    });

    const savedItem = await newitem.save();

    res.json(savedItem);
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

app.post("/editnewtask", async (req, res) => {
  try {
    const token = removeFirstWord(req.body.headers.Authorization);

    if (!token) return res.status(400).json({ errorMessage: "אינך מחובר" });

    const validatedUser = jwt.verify(token, process.env.JWTSECRET);

    const userr = await User.findById(validatedUser.user);

    const { name, desc, id } = req.body;

    const editItem = await Task.findById(id);

    editItem.name = name;

    editItem.desc = desc;

    const savedItem = await editItem.save();

    res.json(savedItem);
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

app.post("/deletet", async (req, res) => {
  try {
    const token = removeFirstWord(req.body.headers.Authorization);

    if (!token) return res.status(400).json({ errorMessage: "אינך מחובר" });

    const validatedUser = jwt.verify(token, process.env.JWTSECRET);

    const userr = await User.findById(validatedUser.user);

    const { id } = req.body;

    const editItem = await Task.findById(id);

    editItem.isDeleted = true;

    const savedItem = await editItem.save();

    res.json(savedItem);
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

app.get("/allt", async (req, res) => {
  try {
    let token;
    try {
      token = removeFirstWord(req.headers.authorization);
    } catch (e) {}
    if (!token)
      token = req.headers.cookies.substring(6, req.headers.cookie.length);

    if (!token) return res.status(400).json({ errorMessage: "אינך מחובר" });

    let mapOfPeople = [];

    const resaf = await Task.find({ isDeleted: false });
    let resa = [];
    for (let i = 0; i < resaf.length; i++) {
      console.log(i);
      let index = false;
      for (let j = 0; j < mapOfPeople.length; j++) {
        if (mapOfPeople[j].id.toString() == resaf[i].owner.toString())
          index = j;
      }
      if (index || index === 0)
        resa.push({
          ...resaf[i].toJSON(),
          owner: mapOfPeople[index].name,
        });
      else {
        // console.log("asked cause it was " + resaf[i].owner.toString());
        // console.log("and index is " + index);
        let name = (await User.findById(resaf[i].owner.toString())).name;
        mapOfPeople.push({ id: resaf[i].owner.toString(), name: name });
        resa.push({
          ...resaf[i].toJSON(),
          owner: name,
        });
      }
    }
    console.log(mapOfPeople);

    res.json(resa);
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

app.post("/letime", async (req, res) => {
  try {
    const { took } = req.body;

    const newitem = new Time({
      time: took,
    });

    const savedItem = await newitem.save();

    res.json(savedItem);
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

app.get("/hmtime", async (req, res) => {
  try {
    let token;
    try {
      token = removeFirstWord(req.headers.authorization);
    } catch (e) {}
    if (!token)
      token = req.headers.cookies.substring(6, req.headers.cookie.length);

    if (!token) return res.status(400).json({ errorMessage: "אינך מחובר" });

    const times = await Time.find();
    let avg = 0;
    for (let i = 0; i < times.length; i++) {
      avg += times[i].time;
    }

    avg /= times.length;

    res.json({ t: Math.round(avg / 1000) + 1 });
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

app.get("/getttime", async (req, res) => {
  try {
    let token;
    try {
      token = removeFirstWord(req.headers.authorization);
    } catch (e) {}
    if (!token)
      token = req.headers.cookies.substring(6, req.headers.cookie.length);

    if (!token) return res.status(400).json({ errorMessage: "אינך מחובר" });

    const types = ["no-CTO", "Other", "Neurobica-Admin", "Neurobica-App"];

    let typesreses = await Promise.all(
      types.map(async (type) => {
        let reses = await TTime.find({ type: type });

        return {
          type: type,
          running:
            reses.filter((res) => res.startorstop).length -
              reses.filter((res) => !res.startorstop).length ===
            1,
          sum:
            reses.filter((res) => res.startorstop).length -
              reses.filter((res) => !res.startorstop).length ===
            1
              ? reses
                  .filter((res) => !res.startorstop)
                  .map((o) => o.when.getTime())
                  .reduce(
                    (previousValue, currentValue) =>
                      previousValue + currentValue,
                    0
                  ) -
                reses
                  .filter((res) => res.startorstop)
                  .map((o) => o.when.getTime())
                  .reduce(
                    (previousValue, currentValue) =>
                      previousValue + currentValue,
                    0
                  ) +
                reses
                  .filter((res) => res.startorstop)
                  [
                    reses.filter((res) => res.startorstop).length - 1
                  ].when.getTime()
              : reses.filter((res) => res.startorstop).length -
                  reses.filter((res) => !res.startorstop).length ===
                0
              ? reses
                  .filter((res) => !res.startorstop)
                  .map((o) => o.when.getTime())
                  .reduce(
                    (previousValue, currentValue) =>
                      previousValue + currentValue,
                    0
                  ) -
                reses
                  .filter((res) => res.startorstop)
                  .map((o) => o.when.getTime())
                  .reduce(
                    (previousValue, currentValue) =>
                      previousValue + currentValue,
                    0
                  )
              : "There is a serious and critical problem",
        };
      })
    );

    res.json(typesreses);
  } catch (err) {
    console.log(err);
    res.json([
      { type: "no-CTO", sum: 0 },
      { type: "Other", sum: 0 },
      { type: "Neurobica-Admin", sum: 0 },
      { type: "Neurobica-App", sum: 0 },
    ]);
  }
});

function getAccessToken() {
  return new Promise(function (resolve, reject) {
    const key = require("./neurobica-admin-859c021902e0.json");
    const jwtClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      "https://www.googleapis.com/auth/firebase.messaging",
      null
    );
    jwtClient.authorize(function (err, tokens) {
      if (err) {
        reject(err);
        return;
      }
      resolve(tokens.access_token);
    });
  });
}

function sendNotifications(subscriptions) {
  // Create the notification content.
  const notification = JSON.stringify({
    title: "Hello, Notifications!",
    options: {
      body: `ID: ${Math.floor(Math.random() * 100)}`,
    },
  });
  // Customize how the push service should attempt to deliver the push message.
  // And provide authentication information.
  const options = {
    TTL: 10000,
    vapidDetails: vapidDetails,
  };
  // Send a push message to each client specified in the subscriptions array.
  subscriptions.forEach((subscription) => {
    const endpoint = subscription.endpoint;
    const id = endpoint.substr(endpoint.length - 8, endpoint.length);
    webpush
      .sendNotification(subscription, notification, options)
      .then((result) => {
        console.log(`Endpoint ID: ${id}`);
        console.log(`Result: ${result.statusCode}`);
      })
      .catch((error) => {
        console.log(`Endpoint ID: ${id}`);
        console.log(`Error: ${error} `);
      });
  });
}

app.use(bodyparser.json());

app.post("/add-subscription", (request, response) => {
  console.log(`Subscribing ${request.body.endpoint}`);
  db.get("subscriptions").push(request.body).write();
  response.sendStatus(200);
});

app.post("/remove-subscription", (request, response) => {
  console.log(`Unsubscribing ${request.body.endpoint}`);
  db.get("subscriptions").remove({ endpoint: request.body.endpoint }).write();
  response.sendStatus(200);
});

app.post("/notify-me", (request, response) => {
  console.log(`Notifying ${request.body.endpoint}`);
  const subscription = db
    .get("subscriptions")
    .find({ endpoint: request.body.endpoint })
    .value();
  sendNotifications([subscription]);
  response.sendStatus(200);
});

app.post("/notify-all", (request, response) => {
  console.log("Notifying all subscribers");
  const subscriptions = db.get("subscriptions").cloneDeep().value();
  if (subscriptions.length > 0) {
    sendNotifications(subscriptions);
    response.sendStatus(200);
  } else {
    response.sendStatus(409);
  }
});

app.get("/:price", async (req, res) => {
  try {
    const price = req.params.price;
    console.log(price);
    console.log(parseFloat(price));
    console.log(parseFloat(price) < 0.95);
    if (parseFloat(price) < 0.95)
      client.messages
        .create({
          body: "BEAN is LOWER than 0.95!!! - it is " + price,
          from: "+15302355598",
          to: "+12312374619",
        })
        .catch((e) => console.log(e));

    res.status(200).send();
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

const accountSid = "ACb56542d282e469142290abbc1c21b238"; //BENJI!
const authToken = "5e093feacc8d6afbc6471b70a641fa3d"; //BENJI!
const client = new Twilio(accountSid, authToken); //BENJI!
