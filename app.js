const express = require("express");
const path = require("path");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const neo4j = require("neo4j-driver").v1;

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

const driver = neo4j.driver(
  "bolt://localhost",
  neo4j.auth.basic("neo4j", "Dominic1")
);
const session = driver.session();

// Home route
app.get("/", (req, res) => {
  session
    .run("MATCH(n) RETURN n")
    .then(result => {
      result.records.forEach(record => console.log(record._fields[0]));
    })
    .catch(e => console.log(e));
  res.render("index");
});

app.listen(3000);

console.log("Server started on port 3000");

module.exports = app;
