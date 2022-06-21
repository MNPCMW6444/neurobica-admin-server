const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { google } = require("googleapis");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const Item = require("./models/itemModel");
const User = require("./models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { process_params } = require("express/lib/router");
dotenv.config();

const axios = require("axios");

// setup express server

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["https://admin.neurobica.online", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(cookieParser());

const PORT = process.env.PORT || 5050;
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
    const token = req.cookies.token;

    if (!token) return res.status(400).json({ errorMessage: "אינך מחובר" });

    const validatedUser = jwt.verify(token, process.env.JWTSECRET);

    const userr = await User.findById(validatedUser.user);

    res.json(userr);
  } catch (err) {
    return res.status(400).json({ errorMessage: "אינך מחובר" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password)
      return res
        .status(400)
        .json({ errorMessage: "מספר אישי או סיסמה לא התקבלו" });

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

    res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      })
      .send();
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

app.get("/logout", (req, res) => {
  res
    .cookie("token", "", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      expires: new Date(0),
    })
    .send();
});

app.put("/changemypass", async (req, res) => {
  try {
    const { iMA } = req.body;

    const token = req.cookies.token;

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
    console.error(err);
    res.status(500).send();
  }
});

app.get("/all", async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) return res.status(400).json({ errorMessage: "אינך מחובר" });

    const validatedUser = jwt.verify(token, process.env.JWTSECRET);

    let items = await Item.find();
    let newi;
    let resa = new Array();
    for (let i = 0; i < items.length; i++) {
      let userr = await User.findById(validatedUser.user);
      newi = items[i].toObject();
      newi.owner = userr.name;
      resa.push(newi);
    }
    res.json(resa);
  } catch (err) {
    res.status(500).send();
  }
});

app.post("/publish", async (req, res) => {
  console.log("PUBLISH:");
  try {
    const { desc, time } = req.body;
    const token = req.cookies.token;
    if (!token) return res.status(400).json({ errorMessage: "אינך מחובר" });
    const validatedUser = jwt.verify(token, process.env.JWTSECRET);
    const userr = await User.findById(validatedUser.user);

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
                console.log("Req " + j + " is: " + Object.keys(response));
              })
              .catch((error) => {
                console.log("Req " + j + " is: " + Object.keys(error));
              });
          }
      }
    } catch (e) {}
    res.json(savedItem);
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

app.post("/notify", async (req, res) => {
  try {
    const { token2 } = req.body;
    const token = req.cookies.token;
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
