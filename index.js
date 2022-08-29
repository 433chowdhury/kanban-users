import express from "express";
import sqlite3 from "sqlite3";
import cors from "cors";
import bodyParser from "body-parser";

const port = process.env.PORT || 3001;

const app = express();

// parsing json body data and catching parsing error
app.use(bodyParser.json());

// app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

let db = new sqlite3.Database("./db/kanban_users_db.db", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the kanban_users_db database.");
});

const CREATE_USERS_TABLE =
  "CREATE TABLE IF NOT EXISTS users (user_id INTEGER PRIMARY KEY AUTOINCREMENT,first_name TEXT NOT NULL,last_name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,password TEXT NOT NULL);";

db.run(CREATE_USERS_TABLE, (err) => {
  if (err) console.log("Error while creating users table!", err);
  else console.log("Successfully created users table!");
});

const CREATE_CARDS_TABLE =
  "CREATE TABLE IF NOT EXISTS cards (card_id INTEGER PRIMARY KEY AUTOINCREMENT,card_name TEXT UNIQUE NOT NULL, board_name TEXT NOT NULL, user_id INTEGER NOT NULL, card_order INTEGER NOT NULL);";

db.run(CREATE_CARDS_TABLE, (err) => {
  if (err) console.log("Error while creating cards table!", err);
  else console.log("Successfully created cards table!");
});

const CREATE_REVIEW_TABLE =
  "CREATE TABLE IF NOT EXISTS review (review_id INTEGER PRIMARY KEY AUTOINCREMENT,review TEXT,card_id INTEGER NOT NULL, user_id INTEGER NOT NULL);";

db.run(CREATE_REVIEW_TABLE, (err) => {
  if (err) console.log("Error while creating review table!", err);
  else console.log("Successfully created review table!");
});

app.post("/signin", (req, res) => {
  console.log(`Get user: ${req.body}`);
  const GET_USER =
    "SELECT user_id,first_name,last_name,email,password FROM users WHERE email=? AND password=?";
  db.get(GET_USER, [req.body.email, req.body.password], (err, row) => {
    console.log({
      err,
      row,
      email: req.body,
      password: req.body,
    });
    if (err) res.status(500).send(err);
    else if (!row) res.status(404).send("No Record");
    else res.send(row);
  });
});

app.post("/signup", (req, res) => {
  console.log("signup request recieved!");
  const SET_USER = `INSERT INTO users (first_name,last_name,email,password) VALUES (?, ?, ?, ?);`;
  db.run(
    SET_USER,
    [
      req.body.first_name,
      req.body.last_name,
      req.body.email,
      req.body.password,
    ],
    (err) => {
      if (err) res.status(500).send(err);
      else res.status(201).send(`User created!`);
    }
  );
});

app.get("/card/:user_id", (req, res) => {
  console.log(`Get cards: ${req.params.user_id}`);
  const GET_CARDS =
    "SELECT card_id,card_name,board_name,card_order FROM cards WHERE user_id=?";
  db.all(GET_CARDS, [req.params.user_id], (err, rows) => {
    if (err) res.status(500).send(err);
    else res.send(rows);
  });
});

app.post("/card", (req, res) => {
  console.log("Save Card: ", req.body);
  const SET_CARDS =
    "INSERT INTO cards (card_name,board_name,user_id,card_order) VALUES(?, ?, ?, ?);";
  db.run(
    SET_CARDS,
    [
      req.body.card_name,
      req.body.board_name,
      req.body.user_id,
      req.body.card_order,
    ],
    (err) => {
      console.log(err);
      if (err) res.status(500).send(err);
      else res.send("Card added!");
    }
  );
});

app.post("/update-all-card", (req, res) => {
  console.log("Save all Card: ", req.body);
  const UPDATE_CARD =
    "UPDATE cards SET board_name=?,card_order=? WHERE card_id=?;";
  try {
    for (const card of req.body) {
      db.run(
        UPDATE_CARD,
        [card.board_name, card.card_order, card.card_id],
        (err) => {
          console.log(err);
          // if (err) res.status(500).send(err);
          // else res.send("Cards Updated!");
        }
      );
    }
    res.send("Cards Updated!");
  } catch (err) {
    if (err) res.status(500).send(err);
  }
});

app.get("/review/:card_id", (req, res) => {
  console.log(`Get Review: ${req.params.card_id}`);
  const GET_REVIEW =
    "SELECT r.review_id,r.review,u.user_id,u.first_name,u.last_name FROM review r INNER JOIN users u ON r.user_id = u.user_id WHERE r.card_id=?";
  db.all(GET_REVIEW, [req.params.card_id], (err, rows) => {
    if (err) res.status(500).send(err);
    else res.send(rows);
  });
});

app.post("/review", (req, res) => {
  console.log("Save Review: ", req.body);
  const SET_REVIEW =
    "INSERT INTO review (review,card_id,user_id) VALUES(?, ?, ?);";
  db.run(
    SET_REVIEW,
    [req.body.review, req.body.card_id, req.body.user_id],
    (err) => {
      console.log(err);
      if (err) res.status(500).send(err);
      else res.send("Review added!");
    }
  );
});

app.listen(port, () => {
  console.log(`server started and listening to: ${port}`);
});
