$(document).ready(function(){

//Declare and initialize variables
var player1 = null;
var player2 = null;
var player1Name = "";
var player2Name = "";
var yourPlayerName = "";
var player1Choice = "";
var player2Choice = "";
var turn = 1;

// Initialize Firebase
var config = {
    apiKey: "AIzaSyBzOeeACiv17J95XgTkxTrkwkByUJT1oP4",
    authDomain: "schedulerinfo-56eea.firebaseapp.com",
    databaseURL: "https://schedulerinfo-56eea.firebaseio.com",
    projectId: "schedulerinfo-56eea",
    storageBucket: "schedulerinfo-56eea.appspot.com",
    messagingSenderId: "697827677913"
  };
  firebase.initializeApp(config);

var database = firebase.database();


// Attach a listener to the database /players/ node to listen for any changes
database.ref("/players/").on("value", function(snapshot) {

	// Check for existence of player 1 in the database. If does not, then Update player1 display
	if (snapshot.child("player1").exists()) {
		player1 = snapshot.val().player1;
		player1Name = player1.name;

		$("#playerOneName").text(player1Name);
		$("#player1Stats").html("Win: " + player1.win + ", Loss: " + player1.loss + ", Tie: " + player1.tie);
	} else {
		player1 = null;
		player1Name = "";

		$("#playerOneName").text("Waiting for Player 1");
		$("#playerPanel1").removeClass("playerPanelTurn");
		$("#playerPanel2").removeClass("playerPanelTurn");
		database.ref("/outcome/").remove();
		$("#roundOutcome").html("");
		$("#waitingNotice").html("");
		$("#player1Stats").html("Win: 0, Loss: 0, Tie: 0");
	}

	// Check for existence of player 2 in the database. If does not, then Update player2 display
	if (snapshot.child("player2").exists()) {

		player2 = snapshot.val().player2;
		player2Name = player2.name;

		$("#playerTwoName").text(player2Name);
		$("#player2Stats").html("Win: " + player2.win + ", Loss: " + player2.loss + ", Tie: " + player2.tie);
	} else {
		player2 = null;
		player2Name = "";

		$("#playerTwoName").text("Waiting for Player 2");
		$("#playerPanel1").removeClass("playerPanelTurn");
		$("#playerPanel2").removeClass("playerPanelTurn");
		database.ref("/outcome/").remove();
		$("#roundOutcome").html("");
		$("#waitingNotice").html("");
		$("#player2Stats").html("Win: 0, Loss: 0, Tie: 0");
	}

	// If both players are now present, it's player1's turn
	if (player1 && player2) {
		debugger;
		$("#playerPanel1").addClass("playerPanelTurn");

		$("#waitingNotice").html("Waiting on " + player1Name + " to choose...");
	}

	// If both players leave the game, empty the chat session
	if (!player1 && !player2) {
		database.ref("/chat/").remove();
		database.ref("/turn/").remove();
		database.ref("/outcome/").remove();

		$("#chatDisplay").empty();
		$("#playerPanel1").removeClass("playerPanelTurn");
		$("#playerPanel2").removeClass("playerPanelTurn");
		$("#roundOutcome").html("");
		$("#waitingNotice").html("");
	}
});

// Attach a listener that detects user disconnection events
database.ref("/players/").on("child_removed", function(snapshot) {
	var msg = snapshot.val().name + " has disconnected!";
	var chatKey = database.ref().child("/chat/").push().key;
	database.ref("/chat/" + chatKey).set(msg);
});

// Attach a listener to the database /chat/ node to listen for any new chat messages
database.ref("/chat/").on("child_added", function(snapshot) {
	var chatMsg = snapshot.val();
	var chatEntry = $("<div>").html(chatMsg);

	// Change the color of the chat message depending on user or connect/disconnect event
	if (chatMsg.includes("disconnected")) {
		chatEntry.addClass("chatColorDisconnected");
	} else if (chatMsg.includes("joined")) {
		chatEntry.addClass("chatColorJoined");
	} else if (chatMsg.startsWith(yourPlayerName)) {
		chatEntry.addClass("chatColor1");
	} else {
		chatEntry.addClass("chatColor2");
	}

	$("#chatDisplay").append(chatEntry);
	$("#chatDisplay").scrollTop($("#chatDisplay")[0].scrollHeight);
});

// Attach a listener to the database /turn/ node to listen for any changes
database.ref("/turn/").on("value", function(snapshot) {
	// Check if it's player1's turn
	if (snapshot.val() === 1) {
		turn = 1;

		// Update the display if both players are in the game
		if (player1 && player2) {
			debugger;
			$("#p1Rock").removeClass("playerSelectedOpt");
			$("#p1Paper").removeClass("playerSelectedOpt");
			$("#p1Scissors").removeClass("playerSelectedOpt");
			$("#playerPanel1").addClass("playerPanelTurn");
			$("#playerPanel2").removeClass("playerPanelTurn");
			$("#waitingNotice").html("Waiting on " + player1Name + " to choose...");
		}
	} else if (snapshot.val() === 2) {
		turn = 2;

		// Update the display if both players are in the game
		if (player1 && player2) {
			$("#p2Rock").removeClass("playerSelectedOpt");
			$("#p2Paper").removeClass("playerSelectedOpt");
			$("#p2Scissors").removeClass("playerSelectedOpt");
			$("#playerPanel1").removeClass("playerPanelTurn");
			$("#playerPanel2").addClass("playerPanelTurn");
			$("#waitingNotice").html("Waiting on " + player2Name + " to choose...");
		}
	}
});

// Attach a listener to the database /outcome/ node to be notified of the game outcome
database.ref("/outcome/").on("value", function(snapshot) {
	$("#roundOutcome").html(snapshot.val());
});

// Attach an event handler to the "Submit" button to add a new user to the database
$("#add-name").on("click", function(event) {
	event.preventDefault();

	// First, make sure that the name field is non-empty and we are still waiting for a player
	if ( ($("#name-input").val().trim() !== "") && !(player1 && player2) ) {
		if (player1 === null) {
			yourPlayerName = $("#name-input").val().trim();
			player1 = {
				name: yourPlayerName,
				win: 0,
				loss: 0,
				tie: 0,
				choice: ""
			};

			database.ref().child("/players/player1").set(player1);

			database.ref().child("/turn").set(1);

			database.ref("/players/player1").onDisconnect().remove();
		} else if( (player1 !== null) && (player2 === null) ) {
			// Adding player2
			console.log("Adding Player 2");

			yourPlayerName = $("#name-input").val().trim();
			player2 = {
				name: yourPlayerName,
				win: 0,
				loss: 0,
				tie: 0,
				choice: ""
			};

			database.ref().child("/players/player2").set(player2);
			database.ref("/players/player2").onDisconnect().remove();
		}

		var msg = yourPlayerName + " has joined!";
		var chatKey = database.ref().child("/chat/").push().key;
		database.ref("/chat/" + chatKey).set(msg);
		$("#name-input").val("");	
	}
});

// Attach an event handler to the chat "Send" button to append the new message to the conversation
$("#chat-send").on("click", function(event) {
	event.preventDefault();

	if ( (yourPlayerName !== "") && ($("#chat-input").val().trim() !== "") ) {
		var msg = yourPlayerName + ": " + $("#chat-input").val().trim();
		$("#chat-input").val("");
		var chatKey = database.ref().child("/chat/").push().key;
		database.ref("/chat/" + chatKey).set(msg);
	}
});

// Monitor Player1's selection
$("#playerPanel1").on("click", ".panelOption", function(event) {
	event.preventDefault();
	if (player1 && player2 && (yourPlayerName === player1.name) && (turn === 1) ) {

		var choice = $(this).text().trim();
debugger;
		if (choice === 'Rock'){
			debugger;
			$("#p1Rock").addClass("playerSelectedOpt");
		} else if (choice === 'Paper'){
			debugger;
			$("#p1Paper").addClass("playerSelectedOpt");
		}else if (choice === 'Scissors'){
			debugger;
			$("#p1Scissors").addClass("playerSelectedOpt");
		}

		player1Choice = choice;
		database.ref().child("/players/player1/choice").set(choice);
		turn = 2;
		database.ref().child("/turn").set(2);
	}
});

// Monitor Player2's selection
$("#playerPanel2").on("click", ".panelOption", function(event) {
	event.preventDefault();
	if (player1 && player2 && (yourPlayerName === player2.name) && (turn === 2) ) {

		var choice = $(this).text().trim();	
		debugger;
		if (choice === 'Rock'){
			debugger;
			$("#p2Rock").addClass("playerSelectedOpt");
		} else if (choice === 'Paper'){
			debugger;
			$("#p2Paper").addClass("playerSelectedOpt");
		}else if (choice === 'Scissors'){
			debugger;
			$("#p2Scissors").addClass("playerSelectedOpt");
		}

		player2Choice = choice;
		database.ref().child("/players/player2/choice").set(choice);
		rpsCompare();
	}
});

// rpsCompare is the main rock/paper/scissors logic to see which player wins
function rpsCompare() {

	if (player1.choice === "Rock") {
		if (player2.choice === "Rock") {
			// Tie
			database.ref().child("/outcome/").set("Tie game!");
			database.ref().child("/players/player1/tie").set(player1.tie + 1);
			database.ref().child("/players/player2/tie").set(player2.tie + 1);
		} else if (player2.choice === "Paper") {
			// Player2 wins
			database.ref().child("/outcome/").set(player2.name + " wins!");
			database.ref().child("/players/player1/loss").set(player1.loss + 1);
			database.ref().child("/players/player2/win").set(player2.win + 1);
		} else { // scissors
			// Player1 wins
			database.ref().child("/outcome/").set(player1.name + " wins!");
			database.ref().child("/players/player1/win").set(player1.win + 1);
			database.ref().child("/players/player2/loss").set(player2.loss + 1);
		}

	} else if (player1.choice === "Paper") {
		if (player2.choice === "Rock") {
			// Player1 wins
			database.ref().child("/outcome/").set(player1.name + " wins!");
			database.ref().child("/players/player1/win").set(player1.win + 1);
			database.ref().child("/players/player2/loss").set(player2.loss + 1);
		} else if (player2.choice === "Paper") {
			// Tie
			database.ref().child("/outcome/").set("Tie game!");
			database.ref().child("/players/player1/tie").set(player1.tie + 1);
			database.ref().child("/players/player2/tie").set(player2.tie + 1);
		} else { // Scissors
			// Player2 wins
			database.ref().child("/outcome/").set(player2.name + " wins!");
			database.ref().child("/players/player1/loss").set(player1.loss + 1);
			database.ref().child("/players/player2/win").set(player2.win + 1);
		}

	} else if (player1.choice === "Scissors") {
		if (player2.choice === "Rock") {
			// Player2 wins
			database.ref().child("/outcome/").set(player2.name + " wins!");
			database.ref().child("/players/player1/loss").set(player1.loss + 1);
			database.ref().child("/players/player2/win").set(player2.win + 1);
		} else if (player2.choice === "Paper") {
			// Player1 wins
			database.ref().child("/outcome/").set(player1.name + " wins!");
			database.ref().child("/players/player1/win").set(player1.win + 1);
			database.ref().child("/players/player2/loss").set(player2.loss + 1);
		} else {
			// Tie
			database.ref().child("/outcome/").set("Tie game!");
			database.ref().child("/players/player1/tie").set(player1.tie + 1);
			database.ref().child("/players/player2/tie").set(player2.tie + 1);
		}
	}

	turn = 1;
	database.ref().child("/turn").set(1);
}

});
