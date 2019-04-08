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
  session.run("MATCH(n:Person) RETURN n").then(result => {
    const personArr = [];
    result.records.forEach(record => {
      // console.log(record._fields[0])
      personArr.push({
        id: record._fields[0].identity.low,
        name: record._fields[0].properties.name
      });
    });

    session
      .run("MATCH(n:Location) RETURN n")
      .then(result2 => {
        const locationArr = [];
        result2.records.forEach(record => {
          locationArr.push(record._fields[0].properties);
        });
        res.render("index", {
          persons: personArr,
          locations: locationArr
        });
      })
      .catch(e => console.log(e));
  });
});

// Add Person
app.post("/person/add", (req, res) => {
  const name = req.body.name;

  session
    .run("CREATE(n:Person {name:{nameParam}}) RETURN n.name", {
      nameParam: name
    })
    .then(result => {
      res.redirect("/");
      session.close;
    })
    .catch(e => console.log(e));
});

// Add Location
app.post("/location/add", (req, res) => {
  const name = req.body.name;
  const state = req.body.state;

  session
    .run("CREATE(n:Location {name:{nameParam}, state:{stateParam}}) RETURN n", {
      nameParam: name,
      stateParam: state
    })
    .then(result => {
      res.redirect("/");
      session.close;
    })
    .catch(e => console.log(e));
});

app.listen(3000);

console.log("Server started on port 3000");

module.exports = app;
