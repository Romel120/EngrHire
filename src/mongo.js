const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

mongoose
  .connect("mongodb://localhost:27017/GhorBanao")
  .then(() => {
    console.log("mongoose connected");
  })
  .catch((e) => {
    console.log("failed");
  });

  mongoose.connect("mongodb://localhost:27017/GhorBanao", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// Define the schemas
const engineerSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: true,
  },
  designation: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  field_of_expertise: {
    type: String,
    required: true,
  },
  job_title: {
    type: String,
  },
  location: {
    type: String,
  },
  website: {
    type: String,
  },
  github: {
    type: String,
  },
  twitter: {
    type: String,
  },
  instagram: {
    type: String,
  },
  facebook: {
    type: String,
  },
  phone: {
    type: String,
  },
  skill: {
    type: String,
  },
  experience: {
    type: String,
  },
  education: {
    type: String,
  },
  profilePicPath: {
    type: String, 
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
});

const jobSchema = new mongoose.Schema({
  jobTitle: {
    type: String,
    required: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client", 
  },

  clientName: {
    type: String,
  },

  category: {
    type: String,
    required: true,
  },
  specifiedCategory: {
    type: String,
  },
  jobDetails: {
    type: String,
    required: true,
  },
  jobRequirements: {
    type: String,
    required: true,
  },
  jobLocation: {
    type: String,
    required: true,
  },
  jobDeadline: {
    type: Date, 
    required: true,
  },
  jobPriceRange: {
    type: String,
    required: true,
  },
  
});

const clientSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: true,
  },
  contact_mobile: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  website: {
    type: String, // Add a website field
  },
  twitter: {
    type: String, // Add a Twitter field
  },
  instagram: {
    type: String, // Add an Instagram field
  },
  facebook: {
    type: String, // Add a Facebook field
  },
  address: {
    type: String, // Add an address field
  },
  profilePicPath: {
    type: String, // Add a field to store the path to the profile picture
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

const bidSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  engineer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Engineer",
    required: true,
  },

  client: {
    type: String,
  },

  engineerFullName: {
    type: String,
  },
  jobTitle: {
    type: String,
  },
  jobDeadline: {
    type: Date,
  },

  bidAmount: {
    type: Number,
    required: true,
  },
  bidDetails: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending", // Initial status is "pending"
  },
  // Other fields as needed
});

const workSchema = new mongoose.Schema({
  engineer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Engineer",
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
  },
  bid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bid",
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
  },

  clientChatMessages: [
    {
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client", // Reference to the Client model
      },
      message: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  engineerChatMessages: [
    {
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Engineer", // Reference to the Engineer model
      },
      message: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  // Other fields related to work
});


// Apply middleware to hash passwords before saving
engineerSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

clientSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

// Create models from the schemas
const Engineer = mongoose.model("Engineer", engineerSchema);
const Job = mongoose.model("Job", jobSchema);

const Bid = mongoose.model("Bid", bidSchema);
const Work = mongoose.model("Work", workSchema);

const Client = mongoose.model("Client", clientSchema);

module.exports = { Job, Engineer, Client, Bid, Work };
