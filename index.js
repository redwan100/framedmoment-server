const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
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

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res
        .status(401)
        .send({ error: true, message: "Unauthorized access" });
    }

    req.decoded = decoded;
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
    const paymentClassCollection = client
      .db("photographyDB")
      .collection("payments");


    app.post("/jwt", (req, res) => {
      const email = req.body;

      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res.send({ token });
    });

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);

      if (user?.role !== "admin") {
        return res
          .status(401)
          .send({ error: true, message: "Unauthorized access" });
      }

      next();
    };

    const verifyInstructor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);

      if (user?.role !== "instructor") {
        return res
          .status(401)
          .send({ error: true, message: "Unauthorized access" });
      }

      next();
    };

    /* ------------------------------- ADMIN ROUTE ------------------------------ */
    app.get("/user/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        res.send({ admin: false });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const result = { admin: user?.role === "admin" };

      res.send(result);
    });

    /* ------------------------------- INSTRUCTOR ROUTE ------------------------------ */
    app.get("/user/instructor/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        res.send({ admin: false });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const result = { instructor: user?.role === "instructor" };

      res.send(result);
    });

    /* ------------------------------- STUDENT ROUTE ------------------------------ */
    app.get("/user/student/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        res.send({ admin: false, instructor: false });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const result = { student: user?.role === "student" };

      res.send(result);
    });
    /* -------------------------------------------------------------------------- */
    /*                                  GET ROUTE                                 */
    /* -------------------------------------------------------------------------- */

    /* -------------------------------- ALL USERS ------------------------------- */
    app.get("/all-users", verifyJWT, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get("/all-classes", async (req, res) => {
      let query = {};

      if (req.query.email) {
        query = { instructorEmail: req.query.email };
      }
      const result = await classCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/instructor-classes/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { instructorEmail: email };

      const result = await classCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/approved-class",  async (req, res) => {
      const filter = { status: "approved" };

      const result = await classCollection.find(filter).toArray();

      res.send(result);
    });

    /* -------------------------- USER ROLE BASED ROUTE ------------------------- */

    app.get("/allSelectedCourse",  async (req, res) => {
      let query = {}
      if(req.query.email){
        query={email: req.query.email}
      }
      const result = await selectedClassCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/selectClassById/:id",  async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}

      const result = await selectedClassCollection.findOne(query)
      res.send(result);
    });

    app.get("/admin/instructors",  async (req, res) => {
      const query = { role: "instructor" };
      const result = await userCollection.find(query).toArray();

      res.send(result);
    });

    app.get("/route-path/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };

      const result = await userCollection.findOne(query);
      res.send(result);
    });

    /* -------------------------------------------------------------------------- */
    /*                                    POST ROUTE                                */
    /* -------------------------------------------------------------------------- */

    /* -------------------- ADDED ALL INSTRUCTOR INFORMATION -------------------- */

    app.post("/admin/instructor", async (req, res) => {
      const instructor = req.body;
      const query = { email: instructor.email };


      const existingInstructor = await instructorCollection.findOne(query);

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
    app.patch("/user/admin/:id", verifyJWT, verifyAdmin, async (req, res) => {
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

      const result = await classCollection.updateOne(filter, updatedDoc);

      res.send(result);
    });



    app.patch('/feedback/:id',verifyJWT, verifyAdmin, async(req,res) => {
      const id = req.params.id;
      const update = req.body;
      const filter = {_id: new ObjectId(id)}
      const updateDoc = {
        $set:{
          feedback: update.feedback
        }
      }
      const result =await classCollection.updateOne(filter,updateDoc)
      
      res.send(result)

    })

    /* -------------------------------------------------------------------------- */
    /*                                DELETE ROUTE                                */
    /* -------------------------------------------------------------------------- */

    app.delete("/selectedClasses/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await selectedClassCollection.deleteOne(query);

      res.send(result);
    });


    /* -------------------------- STRIPE PAYMENT ROUTE -------------------------- */

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });


    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const { classId,...rest} = payment;
      const result = await paymentClassCollection.insertOne(rest)
      const query = {_id: new ObjectId(classId)}

      const deleteResult = await selectedClassCollection.deleteOne(query)

      const filter = {_id: new ObjectId(payment.course_id)}
      const updatedDoc = {
        $inc:{
          availableSeat: -1, 
          enrolled: 1
        }
      }

      const updateResult = await classCollection.updateOne(filter, updatedDoc)

      res.send({ result, deleteResult, updateResult });
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
