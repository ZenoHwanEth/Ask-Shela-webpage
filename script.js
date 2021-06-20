$(document).ready(function () {

	// Your web app's Firebase configuration
	// For Firebase JS SDK v7.20.0 and later, measurementId is optional
	var firebaseConfig = {
		apiKey: "AIzaSyAgwbw9Pr8U8P4wuFPh5pXYLQTwa8bvc1U",
		authDomain: "askshela-4e0e2.firebaseapp.com",
		databaseURL: "https://askshela-4e0e2-default-rtdb.asia-southeast1.firebasedatabase.app",
		projectId: "askshela-4e0e2",
		storageBucket: "askshela-4e0e2.appspot.com",
		messagingSenderId: "585895616708",
		appId: "1:585895616708:web:fce980e7f3df5a10a72991",
		measurementId: "G-9FTLSQTYSS"
	};
	// Initialize Firebase
	firebase.initializeApp(firebaseConfig);
	firebase.analytics();
	var avatar_path="img/happy.jpg"
	var imageStorage = firebase.storage().ref().child('AskShela_resources');

	
	imageStorage.child("avatar.jpg").getDownloadURL().then(
		(url)=> {
			avatar_path = url
		}
	).catch((error) =>{
		console.log(error)
	});
	var suggestion_toggle =false;
	

	//Widget Code
	var bot = '<div class="chatCont" id="chatCont">' +
		'<div class="bot_profile">' +
		'<div class="top-col"></div>' +
		'<img src="'+avatar_path+'" class="bot_p_img">' +	
		'<div class="close">' +
		'<i class="fa fa-times" aria-hidden="true"></i>' +
		'</div>' +
		'</div><!--bot_profile end-->' +
		'<div id="result_div" class="resultDiv"></div>' +
		'<div class="chatForm" id="chat-div">' +
		'<div class="spinner">' +
		'<div class="bounce1"></div>' +
		'<div class="bounce2"></div>' +
		'<div class="bounce3"></div>' +
		'</div>' +
		'<input type="text" id="chat-input" autocomplete="off" placeholder="Start Typing here..."' + 'class="form-control bot-txt" autofocus/>' +
		'</div>' +
		'</div><!--chatCont end-->' +

		'<div class="profile_div">' +
		'<div class="row">' +
		'<div class="col-hgt col-sm-offset-2">' +
		'<img  id="chatbot_icon" src="'+avatar_path+'" class="img-circle img-profile">' +
		'</div><!--col-hgt end-->' +
		'<div class="col-hgt">' +
		'<div class="chat-txt">' +
		'' +
		'</div>' +
		'</div><!--col-hgt end-->' +
		'</div><!--row end-->' +
		'</div><!--profile_div end-->';

	$("mybot").html(bot);

	// ------------------------------------------ Toggle chatbot -----------------------------------------------
	$('.img-profile').click(function () {
		$('.img-profile').toggle();
		$('.chatCont').toggle();
		$('.bot_profile').toggle();
		$('.chatForm').toggle();
		document.getElementById('chat-input').focus();
	});

	$('.close').click(function () {
		$('.img-profile').toggle();
		$('.chatCont').toggle();
		$('.bot_profile').toggle();
		$('.chatForm').toggle();
		$('#result_div').empty();
	});




	// on input/text enter--------------------------------------------------------------------------------------
	$('#chat-input').on('keyup keypress', function (e) {
		var keyCode = e.keyCode || e.which;
		var text = $("#chat-input").val();
		if (keyCode === 13) {
			if (text == "" || $.trim(text) == '') {
				e.preventDefault();
				return false;
			} else {
				$("#chat-input").blur();
				setUserResponse(text);
				disableInputfield()
				send(text);
				e.preventDefault();
				return false;
			}
		}
	});

	// on click chatbot icon--------------------------------------------------------------------------------------
	$('#chatbot_icon').on('click', function (e) {
		disableInputfield()
		$('#result_div').empty();
		send("hi");
		showSpinner()
		e.preventDefault();
	});


	//------------------------------------------- Call the RASA API--------------------------------------
	function send(text) {
		
		$.ajax({
			url: 'https://askshelabot.herokuapp.com/webhooks/rest/webhook', //  RASA API
			type: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			data: JSON.stringify({
				"sender": "user",
				"message": text
			}),
			success: function (data, textStatus, xhr) {

				console.log(data)
				setBotResponse(data);

			},
			error: function (xhr, textStatus, errorThrown) {
				console.log('Error in Operation');
				setBotResponse('error');
			}
		});

	}

	//--------------------------------------enlarge image model-------------------------------------
	var span = document.getElementsByClassName("close_modal")[0];
	span.onclick = function() {
		document.getElementById("enlarge_modal").style.display = "none";
	} 
	//------------------------------------ Set bot response in result_div -------------------------------------
	 function setBotResponse(val) {
		setTimeout(async function () {	

			if ($.trim(val) == '' || val == 'error') { //if there is no response from bot or there is some error
				val = 'Sorry I wasn\'t able to understand your Query. Let\' try something else!'
				var BotResponse = '<p class="botResult">' + val + '</p><div class="clearfix"></div>';
				$(BotResponse).appendTo('#result_div');
			} else {
			//if we get message from the bot succesfully
			
			for (var i = 0; i < val.length; i++) {
				var msg = "";
				
				if (val[i]["image"]) { //check if there are any images
					var imageref = val[i]["image"];
					var imagepath;
					//check regrex begin with https:
					if(/^https:/.test(imageref)){
						imagepath = imageref
					}else{
					await imageStorage.child(imageref).getDownloadURL().then(
						(url)=> {
							imagepath = url
						}
					).catch((error) =>{
						console.log(error)
					});
					}
					msg += '<p class="botResult"><img  id="imgur_img" width="200" height="124" src="' + imagepath + '/"></p><div class="clearfix"></div>';
				} 
				else if(val[i]["text"])	{
					msg += '<p class="botResult">' + val[i].text + '</p><div class="clearfix"></div>';
				}
				BotResponse = msg;
				$(BotResponse).appendTo('#result_div');
				
			}

			
			if (Object.keys(val).length !== 0) {
				for(j =0; j < Object.keys(val).length; j++)
					for (i = 0; i < Object.keys(val[j]).length; i++) {
						if (Object.keys(val[j])[i] == "buttons") { //check if buttons(suggestions) are present.
							addSuggestion(val[j]["buttons"])
						}

					}
			}

			var enlarge_modal = document.getElementById("enlarge_modal");
			var enlarge_img = document.getElementById("enlarge_img");
			$('#result_div').on('click','#imgur_img',function(event){
				enlarge_modal.style.display = "block";
				var src = $(this).attr('src');
				enlarge_img.src =src;
			})
				
			}
			scrollToBottomOfResults();
			if(suggestion_toggle==false){
				enableInputfield()
			}
			hideSpinner();
		}, 500);
	}


	//------------------------------------- Set user response in result_div ------------------------------------
	function setUserResponse(val) {
		var UserResponse = '<p class="userEnteredText">' + val + '</p><div class="clearfix"></div>';
		$(UserResponse).appendTo('#result_div');
		$("#chat-input").val('');
		scrollToBottomOfResults();
		showSpinner();
		$('.suggestion').remove();
	}


	//---------------------------------- Scroll to the bottom of the results div -------------------------------
	function scrollToBottomOfResults() {
		var terminalResultsDiv = document.getElementById('result_div');
		terminalResultsDiv.scrollTop = terminalResultsDiv.scrollHeight;
	}


	//---------------------------------------- Spinner ---------------------------------------------------
	function showSpinner() {
		$('.spinner').show();
	}

	function hideSpinner() {
		$('.spinner').hide();
	}

	//--------------------------------------- Input-disable ----------------------------------------------
	function disableInputfield(){
		$("#chat-input").prop('disabled', true);
	}

	function enableInputfield(){
		$("#chat-input").prop('disabled', false);
		$("#chat-input").focus();
	}

	//------------------------------------------- Buttons(suggestions)--------------------------------------------------
	function addSuggestion(textToAdd) {
		setTimeout(function () {	
			var suggestions = textToAdd;
			var suggLength = textToAdd.length;
			$('<p class="suggestion"></p>').appendTo('#result_div');
			// Loop through suggestions
			for (i = 0; i < suggLength; i++) {

				if(suggestions[i].title == "Main Menu")
				{
					$('<span class="sugg-options' + ' red">' + suggestions[i].title + '<div style="display: none; ">'+ suggestions[i].payload + '</div>' + '</span>').appendTo('.suggestion');
				}else{
					$('<span class="sugg-options">' + suggestions[i].title + '<div style="display: none;">'+ suggestions[i].payload + '</div>' + '</span>').appendTo('.suggestion');
				}
			}
			scrollToBottomOfResults();
		}, 500);
	}


	// on click of suggestions get value and send to API.AI
	$(document).on("click", ".suggestion span", function () {
		var text = this.innerText;
		var payload = this.firstElementChild.innerText;
		setUserResponse(text);
		send(payload);
		suggestion_toggle=false;
		$('.suggestion').remove();
	});
	// Suggestions end -----------------------------------------------------------------------------------------

	

	
});
