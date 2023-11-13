const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const session = require("express-session");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const hbs = require("hbs");
const mongoose = require("mongoose");
const app = express();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");




const emailUser = "2014751020@uits.edu.bd";
const emailPassword = "ehsejmpwnrmdktvd";
const jwtSecret = 'yourSecretKey';



const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "2014751020@uits.edu.bd", // your Gmail address
    pass: "ehsejmpwnrmdktvd", // your Gmail password
  },
});


const port = process.env.PORT || 4000;

const server = app.listen(port, () => {
  console.log("port connected");
});


const tokenExpiration = "1h";


const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, jwtSecret, { algorithm: 'HS256' });
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token Verification Error:', error.message);
    res.sendStatus(403);
  }
};



const generateRememberMeToken = (id, role) => {
  return jwt.sign({ id, role }, jwtSecret, { expiresIn: tokenExpiration });
};


app.use(
  session({
    secret: "your-secret-key", // Replace with a secure secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if you are using HTTPS
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Profile pictures will be stored in the 'uploads/' directory
  },
  filename: (req, file, cb) => {
    const extname = path.extname(file.originalname);
    cb(null, "profilePic-" + Date.now() + extname); // Define a unique filename for each profile picture
  },
});

const upload = multer({ storage: storage });

const { Job, Engineer, Client, Bid, Work } = require("./mongo");
const { log } = require("console");

const tempelatePath = path.join(__dirname, "../tempelates");
const publicPath = path.join(__dirname, "../public");

console.log(publicPath);

app.set("view engine", "hbs");

app.set("views", tempelatePath);

app.use(express.static(publicPath));
app.use("/uploads", express.static("uploads"));
app.use(express.static(path.join(__dirname, "uploads")));

// Socket.io setup



const io = require("socket.io")(server);

io.on('connection', (socket) => {
  console.log('A user connected');
  
  // Handle chat messages
  socket.on('chatMessage', async (data) => {
    // Create a new message document and save it to the Work table
    const newMessage = {
      sender: data.sender,
      message: data.message,
    };

    const work = await Work.findById(data.workId);
    if (work) {
      work.engineerChatMessages.push(newMessage);
      work.clientChatMessages.push(newMessage);
      await work.save();
    }

    // Emit the message to both the sender and receiver
    socket.emit('message', newMessage);
    socket.to(data.room).emit('message', newMessage);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// ... (other routes and server configuration)





function isAuthenticated(req, res, next) {
  if (req.session.user) {
    // Perform additional checks if necessary
    const user = req.session.user;

    // Check if the user's session has expired
    if (user.sessionExpired) {
      req.session.destroy(); // Clear the session
      return res.redirect(
        "/login?message=Session expired. Please log in again."
      );
    }

    // Check user roles for role-based authorization
    if (user.role === "Client" && req.originalUrl.startsWith("/engineer")) {
      return res.status(403).send("Access Denied"); // Client can't access Engineer routes
    } else if (
      user.role === "Engineer" &&
      req.originalUrl.startsWith("/client")
    ) {
      return res.status(403).send("Access Denied"); // Engineer can't access Client routes
    }

    // User is authenticated and authorized, proceed to the route handler
    next();
  } else {
    res.redirect("/login");
  }
}

// hbs.registerPartials(partialPath)

app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "chat.html"));
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/signup2", (req, res) => {
  res.render("signup2");
});

app.get("/messege", (req, res) => {
  res.render("messege");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/select", (req, res) => {
  res.render("select");
});

app.get("/forgot-password", (req, res) => {
  res.render("forgot-password"); // Assuming you have a view/template for the forgot password page
});

app.get("/", async (req, res) => {
  // Initialize data variables
  let client = null;
  let engineer = null;
  let userId = null;
  let clientId = null; // Declare these variables with default values
  let engineerId = null;

  // Check if the user is logged in
  if (req.session.user) {
    userId = req.session.user._id;

    if (req.session.user.role === "Client") {
      clientId = req.session.user._id; // Assign the value here

      try {
        // Retrieve the client data based on the client's ID using an async function
        client = await Client.findById(clientId);
      } catch (error) {
        console.error("Error fetching client data:", error);
      }
    } else if (req.session.user.role === "Engineer") {
      engineerId = req.session.user._id; // Assign the value here

      try {
        // Retrieve the engineer data based on the engineer's ID using an async function
        engineer = await Engineer.findById(engineerId);
      } catch (error) {
        console.error("Error fetching engineer data:", error);
      }
    }
  }

  res.render("home", {
    user: req.session.user,
    isClient: req.session.user?.role === "Client",
    isEngineer: req.session.user?.role === "Engineer",
    client,
    engineer,
    clientId: clientId, // Use the variables here
    engineerId: engineerId,
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error while logging out:", err);
      res.status(500).send("Internal server error");
    } else {
      res.render("home");
    }
  });
});

let user, client, engineer, isClient, isEngineer, engineerId, clientId;

// Updated /profile route
app.get("/profile/:engineerId", async (req, res) => {
  const engineerId = req.params.engineerId;

  try {
    const engineer = await Engineer.findById(engineerId);

    if (engineer) {
      const isClient = req.session.user && req.session.user.role === "Client";
      const isEngineer =
        req.session.user && req.session.user.role === "Engineer";

      engineer.profilePicPath =
        "../" + engineer.profilePicPath.replace(/\\/g, "/");

      if (req.session.user && req.session.user.profilePicPath) {
        req.session.user.profilePicPath =
          "../" + req.session.user.profilePicPath.replace(/\\/g, "/");
      }

      const canEdit = isEngineer && engineerId === req.session.user._id;

      res.render("profile", {
        engineer: engineer,
        user: req.session.user,
        isClient: isClient,
        isEngineer: isEngineer,
        engineerId: req.session.user ? req.session.user._id : null,
        canEdit: canEdit, // Pass a variable to indicate that the edit button should not be displayed
      });
    } else {
      res.status(404).send("Engineer not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

// ...

app.get("/client-profile/:clientId", async (req, res) => {
  let userId = null;
  let clientId = req.params.clientId; // Assign the value here

  try {
    if (req.session.user) {
      userId = req.session.user._id;
    }

    // Initialize client and clientJobs
    let client = null;
    let clientJobs = null;

    if (clientId) {
      // Retrieve the client data based on the client's ID using an async function
      client = await Client.findById(clientId);
    }

    if (client) {
      // Fetch the jobs posted by the client
      clientJobs = await Job.find({ client: client._id });

      const isClient = req.session.user && req.session.user.role === "Client";
      const isEngineer =
        req.session.user && req.session.user.role === "Engineer";

      if (client.profilePicPath) {
        client.profilePicPath =
          "../" + client.profilePicPath.replace(/\\/g, "/");
      }

      if (this.user && this.user.profilePicPath) {
        this.user.profilePicPath =
          "../" + this.user.profilePicPath.replace(/\\/g, "/");
      }

      const canEdit = isClient && clientId === req.session.user._id;

      res.render("client-profile", {
        user: this.user,
        isClient: isClient,
        isEngineer: isEngineer,
        clientId: clientId,
        client: client,
        jobs: clientJobs,
        canEdit: canEdit,
      });
    } else {
      res.status(404).send("Client not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

app.post("/signup", upload.single("profilePic"), async (req, res) => {
  try {
    const engineerData = {
      full_name: req.body.full_name,
      designation: req.body.designation,
      mobile: req.body.mobile,
      email: req.body.email,
      password: req.body.password,
      field_of_expertise: req.body.field_of_expertise,
      profilePicPath: req.file ? req.file.path : "",
    };

    const newEngineer = new Engineer(engineerData);
    await newEngineer.save();

    // Redirect or send a success response
    res.redirect("/login");
  } catch (error) {
    console.error("Error saving to the database:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/signup2", upload.single("profilePic"), async (req, res) => {
  try {
    // Extract data from the form submission
    const clientData = {
      full_name: req.body.full_name,
      email: req.body.email,
      password: req.body.password, // Note: In a real-world scenario, never store plain-text passwords. Use bcrypt or another encryption library.
      contact_mobile: req.body.contact_mobile,
      profilePicPath: req.file ? req.file.path : "", // Save the profile picture path if a file was uploaded
    };

    // Save to the database
    const newClient = new Client(clientData);
    await newClient.save();

    // Redirect or send a success response
    res.redirect("/login");
  } catch (error) {
    console.error("Error saving to the database:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.post("/login", async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    // Check in Engineer collection
    this.user = await Engineer.findOne({ email: email });
    let role = "Engineer";

    // If not found in Engineer collection, check Client collection
    if (!this.user) {
      // If not found in Engineer collection, check Client collection
      this.user = await Client.findOne({ email: email });
      role = "Client";
    }


    const token = jwt.sign({ id: this.user._id }, jwtSecret, { expiresIn: '1h', algorithm: 'HS256' });

    // If Remember Me is checked, set a cookie with the token
    if (rememberMe) {
      res.cookie("rememberMeToken", token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 days
    }

    // Validate the password using bcrypt
    if (!this.user) {
      return res.status(401).send("Invalid email or password. User not found.");
    }

    // Validate the password using bcrypt
    console.log('Entered Password:', password);
    console.log('Retrieved Hashed Password:', this.user.password);

    const isMatch = await bcrypt.compare(password, this.user.password);
    console.log('Is Password Match:', isMatch);

    if (!isMatch) {
      return res.status(401).send("Invalid email or password.");
    }

    console.log('Entered Password:', password);
    console.log('Stored Password:', this.user.password);
    console.log('Is Password Match:', isMatch);

    // If login is successful, store user information in session
    req.session.user = {
      email: this.user.email,
      role: role,
      _id: this.user._id,
    };

    // Redirect based on role
    if (role === "Engineer") {
      if (this.user && this.user._id) {
        res.redirect(`/profile/${this.user._id}`);
      } else {
        return res.status(500).send("Internal Server Error: User ID not found");
      }
    } else if (role === "Client") {
      if (this.user && this.user._id) {
        res.redirect(`/client-profile/${this.user._id}`);
      } else {
        return res.status(500).send("Internal Server Error: User ID not found");
      }
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.get("/post-job", isAuthenticated, async (req, res) => {
  if (req.session.user.role === "Client") {
    try {
      const clientId = req.session.user._id;
      const client = await Client.findById(clientId);

      if (client && client.profilePicPath) {
        client.profilePicPath =
          "../" + client.profilePicPath.replace(/\\/g, "/");
      }

      // Assuming your job data is stored in a variable named 'jobsData'

      res.render("post-job", {
        user: req.session.user,
        isClient: req.session.user?.role === "Client",
        isEngineer: req.session.user?.role === "Engineer",
        client: client,
        clientId: req.session.user._id,
      });
    } catch (error) {
      console.error("Error fetching client data:", error);
      res.status(500).send("Internal server error");
    }
  } else {
    // If the user is not a client, you can send a "Forbidden" response or redirect to another page.
    res.status(403).send("Access Denied");
  }
});

app.post("/post-job", isAuthenticated, async (req, res) => {
  const {
    job_title,
    category,
    specified_category,
    job_details,
    job_requirements,
    job_location,
    job_deadline,
    job_price_range,
    clientEmail = req.session.user.email,
  } = req.body;

  try {
    // Fetch the current client based on the email
    const client = await Client.findOne({ email: clientEmail });

    if (!client) {
      return res.status(404).send("Client data not found");
    }

    const jobData = {
      jobTitle: job_title,
      client: client._id,
      category: category,
      specifiedCategory: specified_category,
      jobDetails: job_details,
      jobRequirements: job_requirements,
      jobLocation: job_location,
      jobDeadline: new Date(job_deadline),
      jobPriceRange: job_price_range,
      clientName: client.full_name,
    };

    const job = new Job(jobData);
    await job.save();

    // Redirect to the client's profile page
    res.redirect(`/client-profile/${client._id}`);
  } catch (error) {
    console.error("Error saving job:", error);
    res.status(500).send("Internal server error");
  }
});

app.get("/edit-client-profile/:userId", isAuthenticated, async (req, res) => {
  if (req.session.user && req.session.user.role === "Client") {
    const userId = req.session.user._id;

    // Find the client data based on the user ID
    const clientData = await Client.findById(userId);

    if (clientData) {
      res.render("edit-client-profile", { client: clientData });
    } else {
      // Handle the case when client data is not found
      res.status(404).send("Client data not found");
    }
  } else {
    res.status(403).send("Access Denied");
  }
});

app.post("/edit-client-profile", isAuthenticated, async (req, res) => {
  upload.single("profilePic")(req, res, async (err) => {
    if (err) {
      console.error("File Upload Error:", err);
      return res.status(500).send("File upload failed.");
    }

    // The file was uploaded successfully; now proceed with the rest of the logic

    try {
      // Extract data from the form submission
      const {
        full_name, // This field is optional
        phone,
        mobile,
        address,
        website,
        github,
        twitter,
        instagram,
        facebook,
      } = req.body;

      // Get the user's email from the session
      const clientEmail = req.session.user.email;

      // Fetch the current profile picture path from the database
      const currentClient = await Client.findOne({ email: clientEmail });
      const currentProfilePicPath = currentClient.profilePicPath;

      // Check if a file was uploaded
      let profilePicPath = currentProfilePicPath; // Initialize with the current path

      if (req.file) {
        // If a new file was uploaded, use its path
        profilePicPath = req.file.path;
      }

      // Create an object to hold the update data
      const updateData = {
        phone,
        mobile,
        address,
        website,
        github,
        twitter,
        instagram,
        facebook,
        profilePicPath, // Use the new or current profile picture path
      };

      // Only include full_name in the update data if it's present in the request body
      if (full_name) {
        updateData.full_name = full_name;
      }

      // Find the client in the database and update their profile
      const updatedClient = await Client.findOneAndUpdate(
        { email: clientEmail },
        updateData,
        { new: true }
      );

      // Redirect to the client profile page or any other appropriate page
      res.redirect(`/client-profile/${req.session.user._id}`);
    } catch (error) {
      console.error("Error updating client profile:", error);
      res.status(500).send("Internal Server Error");
    }
  });
});

app.get("/edit-engineer-profile/:userId", isAuthenticated, async (req, res) => {
  if (req.session.user.role === "Engineer") {
    const userId = req.params.userId;

    try {
      const engineerData = await Engineer.findOne({ _id: userId });

      if (engineerData) {
        res.render("edit-engineer-profile", {
          engineer: engineerData,
        });
      } else {
        res.status(404).send("Engineer data not found");
      }
    } catch (error) {
      console.error("Error fetching engineer data:", error);
      res.status(500).send("Internal server error");
    }
  } else {
    res.status(403).send("Access Denied");
  }
});

app.post("/edit-engineer-profile", isAuthenticated, async (req, res) => {
  upload.single("profilePic")(req, res, async (err) => {
    if (err) {
      console.error("File Upload Error:", err);
      return res.status(500).send("File upload failed.");
    }

    try {
      // Extract data from the form submission
      const {
        full_name,
        mobile,
        website,
        github,
        twitter,
        instagram,
        facebook,
      } = req.body;

      // Get the engineer's email from the session
      const engineerEmail = req.session.user.email;

      // Fetch the current profile picture path from the database
      const currentEngineer = await Engineer.findOne({
        email: engineerEmail,
      });
      const currentProfilePicPath = currentEngineer.profilePicPath;

      let profilePicPath = currentProfilePicPath;

      // If a new file was uploaded, use its path
      if (req.file) {
        // If a new file was uploaded, use its path
        profilePicPath = req.file.path;
      }

      // Create an object to hold the update data
      const updateData = {
        mobile,
        website,
        github,
        twitter,
        instagram,
        facebook,
        profilePicPath, // Use the new profile picture path
      };

      // Only include full_name in the update data if it's present in the request body
      if (full_name) {
        updateData.full_name = full_name;
      }

      // Find the engineer in the database and update their profile
      const updatedEngineer = await Engineer.findOneAndUpdate(
        { email: engineerEmail },
        updateData,
        { new: true }
      );

      // Redirect to the engineer profile page or any other appropriate page
      res.redirect(`/profile/${req.session.user._id}`);
    } catch (error) {
      console.error("Error updating client profile:", error);
      res.status(500).send("Internal Server Error");
    }
  });
});

app.get("/job-details/:jobId", isAuthenticated, async (req, res) => {
  const jobId = req.params.jobId;
  let userId = null;
  let clientId = null;
  let engineerId = null;
  let client = null;
  let engineer = null;
  let job = null;

  if (req.session.user) {
    userId = req.session.user._id;

    if (req.session.user.role === "Client") {
      clientId = req.session.user._id;
    } else if (req.session.user.role === "Engineer") {
      engineerId = req.session.user._id;
    }
  }

  try {
    job = await Job.findById(jobId);

    if (job) {
      if (req.session.user.role === "Client") {
        client = await Client.findById(clientId);
        if (client && client.profilePicPath) {
          client.profilePicPath =
            "../" + client.profilePicPath.replace(/\\/g, "/");
        }
      } else if (req.session.user.role === "Engineer") {
        engineer = await Engineer.findById(engineerId);
        if (engineer && engineer.profilePicPath) {
          engineer.profilePicPath =
            "../" + engineer.profilePicPath.replace(/\\/g, "/");
        }
      }

      res.render("job-details", {
        user: req.session.user,
        isClient: req.session.user?.role === "Client",
        isEngineer: req.session.user?.role === "Engineer",
        clientId: clientId,
        engineerId: engineerId,
        client,
        engineer,
        job,
      });
    } else {
      res.status(404).send("Job not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

app.get("/job-list/:categoryName", isAuthenticated, async (req, res) => {
  let userId = null;
  let clientId = null;
  let engineerId = null;
  let client = null;
  let engineer = null;
  let category = req.params.categoryName;

  if (req.session.user) {
    userId = req.session.user._id;

    if (req.session.user.role === "Client") {
      clientId = req.session.user._id;
    } else if (req.session.user.role === "Engineer") {
      engineerId = req.session.user._id;
    }
  }

  try {
    let jobs;

    if (req.params.categoryName === "all") {
      // If the category is "all," fetch all jobs without category filtering
      jobs = await Job.find().populate("client");
    } else {
      // If a specific category is selected, filter jobs by category
      jobs = await Job.find({ category: req.params.categoryName }).populate(
        "client"
      );
    }

    if (req.session.user.role === "Client") {
      client = await Client.findById(clientId);
      if (client && client.profilePicPath) {
        client.profilePicPath =
          "../" + client.profilePicPath.replace(/\\/g, "/");
      }
    } else if (req.session.user.role === "Engineer") {
      engineer = await Engineer.findById(engineerId);
      if (engineer && engineer.profilePicPath) {
        engineer.profilePicPath =
          "../" + engineer.profilePicPath.replace(/\\/g, "/");
      }
    }

    res.render("job-list", {
      jobs,
      user: req.session.user,
      isClient: req.session.user?.role === "Client",
      isEngineer: req.session.user?.role === "Engineer",
      clientId: clientId,
      engineerId: engineerId,
      client,
      engineer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

// Handle submitting bids
// Handle submitting bids
app.post("/submit-bid/:jobId", isAuthenticated, async (req, res) => {
  const jobId = req.params.jobId;
  const engineerId = req.body.engineerId;
  const engineer = await Engineer.findById(engineerId);
  const job = await Job.findById(jobId); // Get engineerId from the form data

  if (!engineerId) {
    return res.status(400).send("Engineer ID not found");
  }

  const { bidAmount, bidDetails } = req.body;

  try {
    // Create a new bid with the engineer's ID set
    const newBid = new Bid({
      job: jobId,
      engineer: engineerId,
      bidAmount,
      bidDetails,
      engineerFullName: engineer.full_name,
      jobTitle: job.jobTitle,
      jobDeadline: job.jobDeadline,
      client: job.client._id,
    });

    // Save the bid to the database
    await newBid.save();

    // Redirect to a confirmation page or back to the job details page
    res.redirect(`/job-details/${jobId}`);
  } catch (error) {
    console.error("Error submitting bid:", error);
    res.status(500).send("Error submitting bid");
  }
});

app.get("/my-bids", isAuthenticated, async (req, res) => {
  try {
    const userBids = await Bid.find({ engineer: req.session.user._id });

    res.render("my-bids", {
      user: req.session.user,
      bids: userBids,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

// Render the list of bids for a specific client based on clientId
app.get("/bids/:clientId", isAuthenticated, async (req, res) => {
  const clientId = req.params.clientId;

  try {
    // Assuming you have a "Bid" model with a "clientId" field that corresponds to the client's _id
    const bids = await Bid.find({ client: clientId });

    if (bids) {
      res.render("bids", {
        user: req.session.user,
        isClient: req.session.user?.role === "Client",
        isEngineer: req.session.user?.role === "Engineer",
        clientId: req.session.user._id,
        bids,
      });
    } else {
      res.status(404).send("Bids not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

// Handle accepting a bid
app.post("/accept-bid", async (req, res) => {
  try {
    const { bidId } = req.body;

    // Update the bid status to "accepted" in the database
    await Bid.findByIdAndUpdate(bidId, { status: "accepted" });

    // Retrieve the accepted bid from the database
    const acceptedBid = await Bid.findById(bidId);

    if (!acceptedBid) {
      // Handle the case where the bid was not found
      return res.status(404).json({ error: "Accepted bid not found" });
    }

    // Fetch related data for the accepted bid
    const clientId = acceptedBid.client;
    const engineerId = acceptedBid.engineer;
    const jobId = acceptedBid.job;

    const client = await Client.findById(clientId);
    const engineer = await Engineer.findById(engineerId);
    const job = await Job.findById(jobId);

    if (!client || !engineer || !job) {
      return res.status(404).json({ error: "Related data not found" });
    }

    // Create a new "Work" document with the relevant information
    const newWork = new Work({
      client: client,
      engineer: engineer,
      job: job,
      bid: acceptedBid,
      // You can add other properties specific to the Work model here
    });

    // Save the new "Work" document to the database
    const savedWork = await newWork.save();

    // Respond with the accepted bid data
    res.json({
      jobTitle: acceptedBid.jobTitle,
      jobDeadline: acceptedBid.jobDeadline,
      engineerFullName: acceptedBid.engineerFullName,
      bidAmount: acceptedBid.bidAmount,
      bidDetails: acceptedBid.bidDetails,
      // Other bid-related data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to accept bid" });
  }
});

// Handle rejecting a bid
app.post("/reject-bid", async (req, res) => {
  try {
    const { bidId } = req.body;

    // Update the bid status to "rejected" in the database
    await Bid.findByIdAndUpdate(bidId, { status: "rejected" });

    // Retrieve the rejected bid from the database
    const rejectedBid = await Bid.findById(bidId);

    if (!rejectedBid) {
      // Handle the case where the bid was not found
      return res.status(404).json({ error: "Rejected bid not found" });
    }

    // Respond with the rejected bid data
    res.json({
      jobTitle: rejectedBid.jobTitle,
      jobDeadline: rejectedBid.jobDeadline,
      engineerFullName: rejectedBid.engineerFullName,
      bidAmount: rejectedBid.bidAmount,
      bidDetails: rejectedBid.bidDetails,
      // Other bid-related data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to reject bid" });
  }
});

// Assuming you have a "Bid" model with a "status" field that can be "accepted," "rejected," or "pending"

// Fetch accepted bids
app.get("/api/accepted-bids", isAuthenticated, async (req, res) => {
  try {
    const userRole = req.session.user.role;
    const userId = req.session.user._id;

    const acceptedBids = await Bid.find({
      status: "accepted",
      [userRole === "Client" ? "client" : "engineer"]: userId,
    }).exec();

    const bidsWithWorkIds = await Promise.all(
      acceptedBids.map(async (bid) => {
        const work = await Work.findOne({ bid: bid._id }); // Adjust this based on your schema

        if (!work) {
          return null; // Handle cases where the work document is not found
        }

        return {
          workId: work._id,
          jobTitle: bid.jobTitle,
          jobDeadline: bid.jobDeadline,
          engineerFullName: bid.engineerFullName,
          bidAmount: bid.bidAmount,
          bidDetails: bid.bidDetails,
          // Other bid-related data
        };
      })
    );

    res.json(bidsWithWorkIds.filter((bid) => bid !== null));
  } catch (err) {
    res.status(500).json({ error: "Error fetching accepted bids" });
  }
});

// Fetch rejected bids
app.get("/api/rejected-bids", async (req, res) => {
  try {
    if (req.session.user.role == "Client") {
      const rejectedBids = await Bid.find({
        status: "rejected",
        client: user._id,
      }).exec();
      res.json(rejectedBids);
    } else {
      const rejectedBids = await Bid.find({
        status: "rejected",
        client: user._id,
      }).exec();
      res.json(rejectedBids);
    }
  } catch (err) {
    res.status(500).json({ error: "Error fetching rejected bids" });
  }
});

// Fetch pending bids
app.get("/api/pending-bids", async (req, res) => {
  try {
    if (req.session.user.role == "Client") {
      const pendingBids = await Bid.find({
        status: "pending",
        client: this.user._id,
      }).exec();
     
      res.json(pendingBids);
    } else {
      const pendingBids = await Bid.find({
        status: "pending",
      }).exec();

      res.json(pendingBids);
    }
  } catch (err) {
    res.status(500).json({ error: "Error fetching pending bids" });
  }
});

app.get("/work/:workId", async (req, res) => {
  try {
    const workId = req.params.workId;

    if (!mongoose.Types.ObjectId.isValid(workId)) {
      return res.status(400).send("Invalid workId");
    }

    const validWorkId = mongoose.Types.ObjectId(workId);

    const work = await Work.findById(validWorkId);

    if (!work) {
      return res.status(404).send("Work not found");
    }

    // Fetch related data for the work
    const client = await Client.findById(work.client);
    const engineer = await Engineer.findById(work.engineer);
    const job = await Job.findById(work.job);

    if (!client || !engineer || !job) {
      return res.status(404).send("Related data not found");
    }

    const bid = await Bid.findById(work.bid);

    if (!bid) {
      return res.status(404).send("Bid not found");
    }

    // Fetch chat messages associated with the work
    const chatMessages = work.chatMessages;

    res.render("work", { work, client, engineer, job, bid, chatMessages });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching data");
  }
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // Check in Engineer collection
    let user = await Engineer.findOne({ email });

    // If not found in Engineer collection, check Client collection
    if (!user) {
      user = await Client.findOne({ email });
    }

    if (!user) {
      return res.status(404).send("User not found");
    }

    const resetToken = jwt.sign({ id: user._id }, "yourSecretKey", { expiresIn: "1h" });
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    const resetLink = `http://localhost:4000/reset-password/${resetToken}`;
    const mailOptions = {
      from: "2014751020@uits.edu.bd",
      to: user.email,
      subject: "Password Reset",
      text: `Click on the following link to reset your password: ${resetLink}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).send("Password reset email sent");
  } catch (error) {
    console.error("Error during forgot password:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Reset password endpoint
app.get('/reset-password/:token', async (req, res) => {
  const token = req.params.token;

  // Verify the reset password token
  try {
    const decoded = jwt.verify(token, jwtSecret);
    console.log('Decoded Token:', decoded);

    // Render the reset-password page with the token
    res.render('reset-password', { token });
  } catch (error) {
    console.error('Token Verification Error:', error);
    res.status(400).send('Invalid or expired token');
  }
});

// Handle the form submission for resetting the password
app.post('/reset-password/:token', async (req, res) => {
  const token = req.params.token;
  const newPassword = req.body.password;

  try {
    const decoded = jwt.verify(token, jwtSecret);

    // Check in Engineer collection
    let user = await Engineer.findById(decoded.id);

    // If not found in Engineer collection, check Client collection
    if (!user) {
      user = await Client.findById(decoded.id);
    }

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Update user's password and clear reset token fields
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Redirect or render a success message
    res.send('Password reset successful');
  } catch (error) {
    console.error('Error during password reset:', error);
    res.status(400).send('Invalid or expired token');
  }
});

app.get("/protected", authenticateToken, (req, res) => {
  res.send(`Hello, ${req.user.role === "Engineer" ? "Engineer" : "Client"} ${req.user._id}`);
});


app.get('/search', async (req, res) => {
  const query = req.query.q;

  try {
    // Use Mongoose's $regex to perform a case-insensitive search
    const engineers = await Engineer.find({
      $or: [
        { full_name: { $regex: new RegExp(query, 'i') } },
        { website: { $regex: new RegExp(query, 'i') } },
      ],
    });

    const clients = await Client.find({
      $or: [
        { full_name: { $regex: new RegExp(query, 'i') } },
        { website: { $regex: new RegExp(query, 'i') } },
      ],
    });

    const jobs = await Job.find({ jobTitle: { $regex: new RegExp(query, 'i') } });

    res.render('search-results', { engineers, clients, jobs, query });
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).send('Internal Server Error');
  }
});

