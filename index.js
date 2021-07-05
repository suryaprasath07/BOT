// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
"use strict";

const functions = require("firebase-functions");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Card, Suggestion } = require("dialogflow-fulfillment");

process.env.DEBUG = "dialogflow:debug"; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(
  (request, response) => {
    const agent = new WebhookClient({ request, response });
    console.log(
      "Dialogflow Request headers: " + JSON.stringify(request.headers)
    );
    console.log("Dialogflow Request body: " + JSON.stringify(request.body));

    var pg = require('pg');

    var client = new pg.Client({
      host: "139.59.92.85",
      port: 5431,
      user: "postgres",
      password: "postgres",
      database: "botapp"

    });
    client.connect(function (err) {
      if (err) {
        return console.error('could not connect to postgres', err);
      } else {
        return console.log('Connected to Database');
      }
    });

    function title(agent) {
      let titlename = agent.parameters.title;
      if (titlename == `Ms` || titlename == `Mrs` || titlename == `mrs` || titlename == `ms`)
        agent.add("Can you please give your first name Ma'am ");
      else if (titlename == `Mr` || titlename == `mr`)
        agent.add("Can you please give your first name Sir");
      else {
        const context = { name: "awaiting_title", lifespan: 1 };
        agent.setContext(context);
        agent.add("Could you please give a valid title given in the option");
      }

    }

    function getId(email) {
      let reference = 0;
      return new Promise(function (resolve, reject) {
        client.query(`select id from users where email = '${email}'`, (err1, res1) => {
          if (!err1) {
            reference = res1.rows[0].id;
            console.log("id from function : " + res1.rows[0].id);
            return resolve(reference);
          } else {
            console.log("select Error from function");
            return resolve(reference);
          }
        });
      });
    }



    function validateName(agent) {
      let name = agent.parameters.name;
      console.log("Name is : " + name);
      if (/^[a-zA-Z ]*$/.test(name)) {
        agent.add(
          `Thank you for providing your first name.Can you confirm ${name} is your first name ?`
        );
      } else {
        const context = { name: "awaiting_name", lifespan: 1 };
        agent.setContext(context);
        agent.add(`Please provide a valid Name`);
      }
    }

    function validateSecName(agent) {
      let secname = agent.parameters.secname;
      console.log("Name is : " + secname);
      if (/^[a-zA-Z ]*$/.test(secname)) {
        agent.add(`Thank you for providing your second name.Can you confirm ${secname} is your second name ?`);
      } else {
        const context = { name: "awaiting_secname", lifespan: 1 };
        agent.setContext(context);
        agent.add(`Please provide a valid Name`);
      }
    }

    function validatebirthYear(agent) {
      let byear = agent.parameters.number;
      if (byear >= 1000 && byear <= 9999)
        agent.add("Please enter your birth month");
      else {
        const context = { name: "awaiting_byear", lifespan: 1 };
        agent.setContext(context);
        agent.add(`Please provide a valid Year`);
      }
    }

    function validatebirthMonth(agent) {
      let bmonth = agent.parameters.month;
      if (bmonth <= 12 && bmonth >= 1)
        agent.add("Please provide your birth date");
      else {
        const context = { name: "awaiting_bmonth", lifespan: 1 };
        agent.setContext(context);
        agent.add(`Please provide a valid Month`);
      }
    }

    function validatebirthDate(agent) {
      let bdate = agent.parameters.date;
      if (bdate <= 31 && bdate >= 1)
        agent.add("Thanks!! Please provide your Gender\n M - Male F - Female  O - Others");
      else {
        const context = { name: "awaiting_bdate", lifespan: 1 };
        agent.setContext(context);
        agent.add(`Please provide a valid Date`);
      }
    }

    function validateLastName(agent) {
      let lastname = agent.parameters.lastname;
      console.log("Name is : " + lastname);
      if (/^[a-zA-Z ]*$/.test(lastname)) {
        agent.add(`Thank you for providing your last name.Can you confirm ${lastname} is your last name ?`);
      } else {
        const context = { name: "awaiting_lastname", lifespan: 1 };
        agent.setContext(context);
        agent.add(`Please provide a valid Name`);
      }

    }



    function validateEmail(agent) {
      let email = agent.parameters.email;
      let reference = 0;
      if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email)) {
        var name = agent.parameters.name;
        return new Promise(function (resolve, reject) {
          client.query(`INSERT INTO users(email, name)VALUES ('${email}','${name}')`, (err, res) => {
            if (!err) {
              console.log("RES FROM INSERT : ", JSON.stringify(res));
              getId(email).then(id => {
                reference = id;
                console.log("reference Number ID : " + id);
                return resolve(id);
              });
            } else {
              agent.add("Email ID Already Taken!Provide a new Email ID.");
              console.log("Error : Exists!");
              const context = { name: "awaiting_email", lifespan: 5 };
              agent.setContext(context);
            }
            return resolve();
          });
        }).then(id => {
          console.log("inserted data reference ID is : " + reference);
          agent.add("inserted data reference ID is : " + reference);
        });
      } else {
        const context = { name: "awaiting_email", lifespan: 5 };
        agent.setContext(context);
        agent.add(`Please provide a valid email address`);
      }
    }


    function getData(agent) {
      let reference_no = agent.parameters.reference_no;
      return new Promise(function (resolve, reject) {
        client.query(`select email,name from users where id = ${reference_no}`, (err, res) => {
          if (!err) {
            if (res.rows.length == 0) {
              agent.add("Enter a valid reference ID to get the Data");
            } else {
              agent.add("Name : " + res.rows[0].name + "  Email id : " + res.rows[0].email + " What u want to change Name/Email?");
            }
            console.log("retreived Data is : ", res.rows);
          } else {
            agent.add("error getting the data");
            console.log("error while retreiving Data");
          }
          return resolve();
        });
      });
    }

    function change(agent) {
      if (agent.parameters.change == `name`) {
        agent.add(`Please enter your name to be updated`);
      }
      else if (agent.parameters.change == `email`) {
        agent.add(`Please enter your email to be updated`);
      }
    }



    function checkForUpdate(agent) {
      var check = agent.parameters.further;
      if (check == "YES" || check == "yes") {
        agent.add("what do you want to update?");
        const context = { 'name': 'ChangeDetails', 'lifespan': 1 };
        agent.setContext(context);
      } else {
        agent.add("Thanks for updating!!");
        const context = { 'name': 'Endintent', 'lifespan': 5 };
        agent.setContext(context);
      }
    }


    function storechange(agent, callback) {
      var Change = agent.parameters.change;
      var cv = agent.parameters.changedvalue;
      if (`${Change}` == "name") {
        if (/^[a-zA-Z ]*$/.test(`${cv}`)) {
          return new Promise(function (resolve, reject) {
            client.query(`UPDATE users SET name='${cv}' WHERE id=${agent.parameters.reference_no}`, (err, res) => {
              if (!err) {
                console.log("here Before !err");
                agent.add("Your data is updated. Do you want to futhere update(YES/NO)?");
              } else {
                console.log("here before err");
                agent.add("error while Updating the Data");
              }
              console.log("Here before resolve");
              return resolve();
            });
          }).then(function (res) {
            const context = { 'name': 'further_update', 'lifespan': 1 };
            console.log("Here Before SetContext");
            agent.setContext(context);
          });
        }
        else {
          const context = { 'name': 'changeName', 'lifespan': 1 };
          agent.setContext(context);
          agent.add(`Please provide a valid Name`);
        }
      }
      else if (`${Change}` == "email") {
        if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(cv)) {
          return new Promise(function (resolve, reject) {
            client.query(`UPDATE users SET email='${cv}' WHERE id=${agent.parameters.reference_no}`, (err, res) => {
              if (!err) {
                console.log("here Before !err");
                agent.add("Your data is updated. Do you want to futhere update(YES/NO)?");
              } else {
                console.log("here before err");
                agent.add("error while Updating the Data");
              }
              console.log("Here before resolve");
              return resolve();
            });
          }).then(function (res) {
            const context = { 'name': 'further_update', 'lifespan': 1 };
            console.log("Here Before SetContext");
            agent.setContext(context);
          });
        }
        else {
          const context = { 'name': 'changeName', 'lifespan': 1 };
          agent.setContext(context);
          agent.add(`Please provide a valid email id`);
        }
      }
      else {
        agent.add("name/email");
        const context = { 'name': 'ChangeDetails', 'lifespan': 1 };
        agent.setContext(context);
      }
    }
    function getGender(agent) {
      let gen = agent.parameters.gender;
      if (gen != "M" && gen != "F" && gen != "any other" && gen != "m" && gen != "f" && gen != "others" && gen != "not both" && gen != "O") {
        agent.add("please provide a valid gender");
        const context = { 'name': 'awaiting_gender', 'lifespan': 1 };
        agent.setContext(context);
      } else {
        agent.add("Thank You.Please Provide Your Nationality.");
      }
    }
    function validateNationality(agent) {
      var string = agent.parameters.country;
      var countryname = string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
      return new Promise(function (resolve, reject) {
        client.query(`select * from country where country = '${countryname}'`, (err, res) => {
          if (!err) {
            if (res.rows.length == 1) {
              agent.add("Thanks for providing the Nationality!! Please enter your passport number");
              console.log("NOT IN ERROR : ", JSON.stringify(res));
            } else {
              console.log("IN NOT ERROR ELSE");
              const context = { name: "awaiting_nationality", lifespan: 5 };
              agent.setContext(context);
              agent.add(`Please provide a valid Nationality`);
            }
          } else {
            console.log("IN ERROR ELSE");
            const context = { name: "awaiting_nationality", lifespan: 5 };
            agent.setContext(context);
            agent.add(`Please provide a valid Nationality`);
          }
          return resolve();
        });
      });
    }

    function getPassport(agent) {
      let pp = agent.parameters.passport;
      var contextIn = agent.getContext("awaiting_name_confirm");
      console.log(JSON.stringify(contextIn));
      var parameters = contextIn.parameters;
      var bday = parameters.number + '-' + parameters.month + '-' + parameters.date;
      var secname = parameters.secname || null;
      var lastname = parameters.lastname || null;
      if (/[a-zA-Z0-9]/.test(`${pp}`)) {
        return new Promise(function (resolve, reject) {
          client.query(`INSERT INTO users(title, first_name, middle_name, last_name, bday, gender, nationality, passport_number)
            VALUES ('${parameters.title}', '${parameters.name}', '${secname}', '${lastname}' , '${bday}' , '${parameters.gender}' , '${parameters.country}' , '${parameters.passport}') RETURNING id`, (err, res) => {
            if (!err) {
              console.log("ID is in IF : " + res.rows[0].id);
              agent.add("Your Data is Added And your Id is : "+res.rows[0].id);
            } else {
              console.log("Error in Inserting Data : " + JSON.stringify(err));
              agent.add("Error in Adding the Data");
            }
            return resolve(res.rows[0].id);
          });
        }).then((id) => {
          console.log("ID is : " + id);
        });
      }
      else {
        const context = { name: "awaiting_passport", lifespan: 5 };
        agent.setContext(context);
        agent.add(`Please provide a valid Passport number`);
      }
    }

    function fallback(agent) {
      agent.add(`I didn't understand`);
      agent.add(`I'm sorry, can you try again?`);
    }

    let intentMap = new Map();
    intentMap.set('2getTitle', title);
    intentMap.set("3getFirstName", validateName);
    intentMap.set("5getSecondName", validateSecName);
    intentMap.set("7getLastName", validateLastName);
    intentMap.set("8getBirthYear", validatebirthYear);
    intentMap.set("9getBirthMonth", validatebirthMonth);
    intentMap.set("10getBirthDate", validatebirthDate);
    intentMap.set("get_emailAddress", validateEmail);
    intentMap.set('getReference', getData);
    intentMap.set('changeDetails', change);
    intentMap.set('storingChanged', storechange);
    intentMap.set('furtherUpdate', checkForUpdate);
    intentMap.set('11getGender', getGender);
    intentMap.set('12getNationality', validateNationality);
    intentMap.set('13getPassport', getPassport);
    intentMap.set("Default Fallback Intent", fallback);
    agent.handleRequest(intentMap);

  }
);
