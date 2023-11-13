function acceptBid(bidId, jobId) {
  console.log("Accept button clicked.");
  console.log("Bid ID: " + bidId);
  console.log("Job ID: " + jobId);
  $.ajax({
    type: "POST",
    url: "/accept-bid",
    data: { bidId: bidId, jobId: jobId },
    success: function (response) {
      console.log("Response from server:", response);
      console.log("AJAX request successful.");
      alert("Bid accepted. Engineer will be notified.");

      // Remove the accepted bid card from the list
      removeBidCard("pending-bids-list", bidId);

      // Add the bid card to the accepted bids section
      addBidToSection("accepted-bids-list", response);
    },
    error: function (error) {
      console.log("AJAX request failed.");
      alert("Error accepting the bid.");
    },
  });
}

function rejectBid(bidId) {
  console.log("Reject button clicked.");
  console.log("Bid ID: " + bidId);
  $.ajax({
    type: "POST",
    url: "/reject-bid",
    data: { bidId: bidId },
    success: function (response) {
      console.log("Response from server:", response);
      console.log("AJAX request successful.");
      alert("Bid rejected.");

      // Remove the rejected bid card from the list
      removeBidCard("pending-bids-list", bidId);

      // Add the bid card to the rejected bids section
      addBidToSection("rejected-bids-list", response);
    },
    error: function (error) {
      console.log("AJAX request failed.");
      alert("Error rejecting the bid.");
    },
  });
}

function removeBidCard(sectionId, bidId) {
  const bidCard = $(`#${sectionId} [data-bidid="${bidId}"]`);
  bidCard.closest("li").remove();
}

function addBidToSection(sectionId, response) {
  const sectionContainer = $(`#${sectionId}`);
  const bidCard = `
  <li>
       
  <div class="container mt-5 mb-5">
    <div class="d-flex justify-content-center row">
      <div class="col-md-10">
          <div class="row p-2 bg-white border rounded bid-card">
             
              <div class="col-md-6 mt-1">
                  <h4>${response.jobTitle}</h4>
                  <h5>${response.jobDeadline}</h5>
                  <div class="d-flex flex-row">
                      <div class="ratings mr-2"><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i></div><span>${response.engineerFullName}</span>
                  </div>
                  
                  <p class="text-justify text-truncate para mb-0">${response.bidDetails}<br><br></p>
              </div>
              <div class="align-items-center align-content-center col-md-3 border-left mt-1">
                  <div class="d-flex flex-row align-items-center">
                      <h4 class="mr-1">${response.bidAmount}</h4>
                  </div>
                  <a class="btn btn-primary btn-sm" href="/work/${response.workId}">View Work</a>
              </div>
      </div>
    </div>
    </div>
    </li>

    
  `;
  sectionContainer.append(bidCard);
}

// You can define a function to fetch and update the accepted bids list here if needed

function fetchAcceptedBids() {
  $.ajax({
    type: "GET",
    url: "/api/accepted-bids",
    success: function (data) {
      console.log("Successfully fetched accepted bids.");
      updateAcceptedBids(data);
    },
    error: function (error) {
      console.log("Error fetching accepted bids: " + JSON.stringify(error));
    },
  });
}

function fetchRejectedBids() {
  $.ajax({
    type: "GET",
    url: "/api/rejected-bids",
    success: function (data) {
      console.log("Successfully fetched rejected bids.");
      updateRejectedBids(data);
    },
    error: function (error) {
      console.log("Error fetching rejected bids: " + JSON.stringify(error));
    },
  });
}

function fetchPendingBids() {
  $.ajax({
    type: "GET",
    url: "/api/pending-bids",
    success: function (data) {
      console.log("Successfully fetched pending bids.");
      updatePendingBids(data);
    },
    error: function (error) {
      console.log("Error fetching pending bids: " + JSON.stringify(error));
    },
  });
}

function updateAcceptedBids(acceptedBids) {
  const acceptedBidsContainer = $("#accepted-bids-list");
  acceptedBidsContainer.empty();

  acceptedBids.forEach(function (bid) {
    const bidCard = `
    <li>
    <div class="container mt-5 mb-5">
      <div class="d-flex justify-content-center row">
        <div class="col-md-10">
          <div class="row p-2 bg-white border rounded bid-card">
            <div class="col-md-6 mt-1">
              <h4>${bid.jobTitle}</h4>
              <h5>${bid.jobDeadline}</h5>
              <div class="d-flex flex-row">
                <div class="ratings mr-2">
                  <i class="fa fa-star"></i>
                  <i class="fa fa-star"></i>
                  <i class="fa fa-star"></i>
                  <i class="fa fa-star"></i>
                </div>
                <span>${bid.engineerFullName}</span>
              </div>
              <p class="text-justify text-truncate para mb-0">${bid.bidDetails}<br><br></p>
            </div>
            <div class="align-items-center align-content-center col-md-3 border-left mt-1">
              <div class="d-flex flex-row align-items-center">
                <h4 class="mr-1">${bid.bidAmount}</h4>
              </div>
              <a class="btn btn-primary btn-sm" href="/work/${bid.workId}">View Work</a>
            </div>
          </div>
        </div>
      </div>
    </div>
    </li>
    `;

    acceptedBidsContainer.append(bidCard);
  });
}

function updateRejectedBids(rejectedBids) {
  const rejectedBidsContainer = $("#rejected-bids-list");
  rejectedBidsContainer.empty();

  rejectedBids.forEach(function (bid) {
    const bidCard = `
      <a href="#" class "bid-card">
      <h3 class="bid-title">${bid.jobTitle}</h3>
      <p class="bid-details">${bid.jobDeadline}</p>
     
          <p class="bid-details">${bid.engineerFullName}</p>
          <p class="bid-details">${bid.bidAmount}</p>
          <p class="bid-details">${bid.bidDetails}</p>
      </a>
    `;

    rejectedBidsContainer.append(bidCard);
  });
}

function updatePendingBids(pendingBids) {
  const pendingBidsContainer = $("#pending-bids-list");
  pendingBidsContainer.empty();

  pendingBids.forEach(function (bid) {
    const bidCard = `
    <li>
       
    <div class="container mt-5 mb-5">
      <div class="d-flex justify-content-center row">
        <div class="col-md-10">
            <div class="row p-2 bg-white border rounded bid-card">
                
                <div class="col-md-6 mt-1">
                    <h4>${bid.jobTitle}</h5>
                    <h5>${bid.jobDeadline}</h5>
                    <div class="d-flex flex-row">
                        <div class="ratings mr-2"><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i></div><span>${bid.engineerFullName}</span>
                    </div>
                    
                    <p class="text-justify text-truncate para mb-0">${bid.bidDetails}<br><br></p>
                </div>
                <div class="align-items-center align-content-center col-md-3 border-left mt-1">
                    <div class="d-flex flex-row align-items-center">
                        <h4 class="mr-1">${bid.bidAmount}</h4>
                    </div>
                  
                    <div class="d-flex flex-column mt-4 bid-actions">
                      <button class="btn btn-primary btn-sm accept-bid" class="" data-bidid="${bid._id}" data-jobid="${bid.job}"
                      onclick="acceptBid('${bid._id}', '${bid.job}')">Accept</button>
                      <button class="btn btn-outline-primary btn-sm mt-2 reject-bid" data-bidid="${bid._id}" onclick="rejectBid('${bid._id}}')">Reject</button>
                      </div>
                </div>
        </div>
      </div>
      </div>
      </li>
    `;

    pendingBidsContainer.append(bidCard);
  });
}

$(document).ready(() => {
  fetchAcceptedBids();
  fetchRejectedBids();
  fetchPendingBids();
});

// JavaScript code to handle messaging

const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");

// When a message is received (e.g., from WebSocket), add it to the chat interface.
function displayMessage(message, sender) {
  const messageElement = document.createElement("li");
  messageElement.textContent = sender + ": " + message;
  chatMessages.appendChild(messageElement);
}

// Send a message when the send button is clicked or Enter key is pressed.
sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});

// Function to send a message
function sendMessage() {
  const message = messageInput.value.trim();
  if (message) {
    // Send the message to the server via WebSocket
    // You need to implement the server-side logic to relay the message to the recipient.

    // Display the message in the chat interface
    displayMessage(message, "You");

    // Clear the input field
    messageInput.value = "";
  }
}
