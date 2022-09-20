const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
const dbPath = path.join(__dirname, "covid19India.db");
app.use(express.json());

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDBStateObjectToResponseObject = (DBObject) => {
  return {
    stateId: DBObject.state_id,
    stateName: DBObject.state_name,
    population: DBObject.population,
  };
};
const convertDBDistrictObjectToResponseObject = (DBObject) => {
  return {
    districtId: DBObject.district_id,
    districtName: DBObject.district_name,
    stateId: DBObject.state_id,
    cases: DBObject.cases,
    cured: DBObject.cured,
    active: DBObject.active,
    deaths: DBObject.deaths,
  };
};
//API 1
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM 
    state
    ORDER BY state_id;`;
  const stateList = await db.all(getStatesQuery);
  response.send(
    stateList.map((eachstate) =>
      convertDBStateObjectToResponseObject(eachstate)
    )
  );
});
//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * FROM
    state 
    WHERE state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertDBStateObjectToResponseObject(state));
});
//API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
    INSERT INTO 
    district(district_name,state_id,cases,cured,active,deaths)
    VALUES 
    ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const dbResponse = await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});
//API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getStateQuery = `
    SELECT * FROM
    district
    WHERE district_id = ${districtId};`;
  const district = await db.get(getStateQuery);
  response.send(convertDBDistrictObjectToResponseObject(district));
});

//API 5
app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
DELETE FROM 
district 
WHERE district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});
//API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictDetails = `
    UPDATE district 
    SET 
    district_name ='${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active=${active},
    deaths=${deaths}
    WHERE district_id = ${districtId};`;
  await db.run(updateDistrictDetails);
  response.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatusQuery = `
    SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM district
    WHERE state_id =${stateId};`;
  const stats = await db.get(getStatusQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const getStateDetails = `
    SELECT state_name
    FROM district
    NATURAL JOIN state
    WHERE district_id = ${districtId};`;
  const state = await db.get(getStateDetails);
  response.send({
    stateName: state.state_name,
  });
});
module.exports = app;
