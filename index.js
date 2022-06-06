const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const proModal = require("./models/proModal");
const { process_params } = require("express/lib/router");
dotenv.config();

// setup express server

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["https://profit.neurobica.online"],
    credentials: true,
  })
);
app.use(cookieParser());

const PORT = process.env.PORT || 5000;
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

app.get("/getallmy", async (req, res) => {
  try {
    const pros = await proModal.find();

    res.json(pros);
  } catch (err) {
    res.status(500).send();
  }
});

app.post("/color", async (req, res) => {
  try {
    const { id, i } = req.body;

    const pro = await proModal.findById(id);

    let wastasks = pro.tasks;
    let task = wastasks.splice(i, 1);

    let av = { name: task[0].name, complete: !task[0].complete };

    wastasks.splice(i, 0, av);

    const results = wastasks.filter((element) => {
      return (
        typeof element === "object" &&
        !Array.isArray(element) &&
        element !== null
      );
    });

    pro.tasks = results;

    const newaa = await pro.save();

    res.json(newaa);
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

app.post("/name", async (req, res) => {
  try {
    const { id, i, name } = req.body;

    const pro = await proModal.findById(id);

    let wastasks = pro.tasks;
    let task = wastasks.splice(i, 1);

    let av = { name: name, complete: false };

    wastasks.splice(i, 0, av);

    const results = wastasks.filter((element) => {
      return (
        typeof element === "object" &&
        !Array.isArray(element) &&
        element !== null
      );
    });

    pro.tasks = results;

    const newaa = await pro.save();

    res.json(newaa);
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

app.post("/sendtask", async (req, res) => {
  try {
    const { name, id } = req.body;
    const newa = await proModal.findById(id);

    newa.tasks.push({ name: name, complete: false });

    const snewa = await newa.save();

    res.json(snewa);
  } catch (err) {
    res.status(500).send();
    console.log(err);
  }
});

app.post("/sendpro", async (req, res) => {
  try {
    const { pro } = req.body;

    const newa = new proModal({ header: pro, tasks: new Array() });

    const newa2 = await newa.save();
    res.json(newa2);
  } catch (err) {
    res.status(500).send();
    console.log(err);
  }
});
