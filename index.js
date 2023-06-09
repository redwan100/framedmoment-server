const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();

/* -------------------------------------------------------------------------- */
/*                                 MIDDLEWARE                                 */
/* -------------------------------------------------------------------------- */
app.use(express.json());
app.use(cors());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }

  const token = authorization.split(" ")[1];

  jwt.verify(token, ACCESS_TOKEN_SECRET, (error, decoded) => {
    if(error) {
      return res.status(401).send({error:true, message:'Unauthorized access'})
    }

    req.decoded = decoded
    next();
  });
};

/* -------------------------------------------------------------------------- */
/*                                   ROUTES                                   */
/* -------------------------------------------------------------------------- */
app.get("/", (req, res) => {
  res.send("Photography server is running");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yq2vgbi.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const userCollection = client.db("photographyDB").collection("users");
    const instructorCollection = client
      .db("photographyDB")
      .collection("instructors");
    const classCollection = client.db("photographyDB").collection("classes");
    const selectedClassCollection = client
      .db("photographyDB")
      .collection("selectedClasses");

    app.post("/jwt", (req, res) => {
      const body = req.body;

      const token = jwt.sign(body, ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });

      res.send({ token });
    });
    /* -------------------------------------------------------------------------- */
    /*                                  GET ROUTE                                 */
    /* -------------------------------------------------------------------------- */

    /* -------------------------------- ALL USERS ------------------------------- */
    app.get("/all-users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get("/all-classes", async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result);
    });

    app.get("/approved-class",  async (req, res) => {
      const filter = { status: "approved" };

      const result = await classCollection.find(filter).toArray();

      res.send(result);
    });

    app.get("/allSelectedCourse", async (req, res) => {
      const result = await selectedClassCollection.find().toArray();

      res.send(result);
    });


    app.get('/admin/instructors', async (req, res) => {
      const query= {role: 'instructor'}
      const result = await userCollection.find(query).toArray()
      
      res.send(result)
    })

    /* -------------------------------------------------------------------------- */
    /*                                    POST ROUTE                                */
    /* -------------------------------------------------------------------------- */

    /* -------------------- ADDED ALL INSTRUCTOR INOFRMATION -------------------- */

    app.post("/admin/instructor", async (req, res) => {
      const instructor = req.body;
      const query = { email: instructor.email };

      console.log(instructor.email);

      const existingInstructor =await instructorCollection.findOne(query);

      if (existingInstructor) {
        return res.send("Already instructor exist");
      }

      const result = await instructorCollection.insertOne(instructor);

      res.send(result);
    });

    /* -------------------------- ADDED VALID USER INFORMATION ON DATABASE -------------------------- */
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await userCollection.insertOne(user);

      res.send(result);
    });

    /* -------------------------- ADDED INSTRUCTOR CLASS ON DATABASE -------------------------- */
    app.post("/class", async (req, res) => {
      const body = req.body;
      const result = await classCollection.insertOne(body);
      res.send(result);
    });

    app.post("/userSelectedClass", async (req, res) => {
      const bodyData = req.body;
      const result = await selectedClassCollection.insertOne(bodyData);

      res.send(result);
    });
    /* -------------------------------------------------------------------------- */
    /*                                  PATCH / UPDATE ROUTE                        */
    /* -------------------------------------------------------------------------- */
    app.patch("/user/admin/:id", async (req, res) => {
      const id = req.params.id;
      const role = req.body;
      const filter = { _id: new ObjectId(id) };

      const updatedDoc = {
        $set: {
          role: role.text,
        },
      };

      const result = await userCollection.updateOne(filter, updatedDoc);

      res.send(result);
    });

    app.patch("/class-status/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.body;
      const filter = { _id: new ObjectId(id) };

      const updatedDoc = {
        $set: {
          status: status.text,
        },
      };

      console.log(id, status, filter);
      const result = await classCollection.updateOne(filter, updatedDoc);

      res.send(result);
    });

    /* -------------------------------------------------------------------------- */
    /*                                DELETE ROUTE                                */
    /* -------------------------------------------------------------------------- */

    app.delete("/selectedClasses/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await selectedClassCollection.deleteOne(query);

      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Database is connected😀😀😀 ");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

/* -------------------------------------------------------------------------- */
/*                                  LISTENER                                  */
/* -------------------------------------------------------------------------- */

app.listen(port, () => {
  console.log(`Photography is listening on port ${port}`);
});
