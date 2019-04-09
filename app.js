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

// Friends Connect Route
app.post("/friends/connect", (req, res) => {
  const name1 = req.body.name1;
  const name2 = req.body.name2;

  session
    .run(
      "MATCH(a:Person {name:{nameParam1}}),(b:Person {name:{nameParam2}}) MERGE(a)-[r:FRIENDS]->(b) RETURN a,b",
      {
        nameParam1: name1,
        nameParam2: name2
      }
    )
    .then(result => {
      res.redirect("/");
      session.close;
    })
    .catch(e => console.log(e));
});

// Add Birthplace Route
app.post("/person/born/add", (req, res) => {
  const name1 = req.body.name1;
  const name2 = req.body.name2;
  const state = req.body.state;
  const year = req.body.year;

  session
    .run(
      "MATCH(a:Person {name:{nameParam1}}),(b:Location {name:{nameParam2}, state:{stateParam}}) MERGE(a)-[r:BORN_IN {year:{yearParam}}]->(b) RETURN a,b",
      {
        nameParam1: name1,
        nameParam2: name2,
        stateParam: state,
        yearParam: year
      }
    )
    .then(result => {
      res.redirect("/");
      session.close;
    })
    .catch(e => console.log(e));
});

// Person Route
app.get("/person/:id", (req, res) => {
  const id = req.params.id;

  session
    .run("MATCH(a:Person) WHERE id(a)=toInt({idParam}) RETURN a.name as name", {
      idParam: id
    })
    .then(result => {
      const name = result.records[0].get("name");

      session
        .run(
          "OPTIONAL MATCH(a:Person)-[r:BORN_IN]-(b:Location) WHERE id(a)=toInt({idParam}) RETURN b.name as city, b.state as state",
          { idParam: id }
        )
        .then(result2 => {
          const city = result2.records[0].get("city");
          const state = result2.records[0].get("state");

          session
            .run(
              "OPTIONAL MATCH (a:Person)-[r:FRIENDS]-(b:Person) WHERE id(a)=toInt({idParam}) RETURN b",
              { idParam: id }
            )
            .then(result3 => {
              const friendsArr = [];

              result3.records.forEach(record => {
                console.log(record);
                if (record._fields[0] !== null) {
                  friendsArr.push({
                    id: record._fields[0].identity.low,
                    name: record._fields[0].properties.name
                  });
                }
              });

              res.render("person", {
                id: id,
                name: name,
                city: city,
                state: state,
                friends: friendsArr
              });

              session.close();
            })
            .catch(e => console.log(e));
        });
    });
});

app.listen(3000);

console.log("Server started on port 3000");

module.exports = app;
