

var db = firebase.database();

var userEmail;
var userName;

/********** Hande Password Login **********************/
$("#authentication-login-button").click(function (event) {
    event.preventDefault();
    var email = $("#authentication-email-input");
    var password = $("#authentication-password-input");

    firebase.auth().signInWithEmailAndPassword(email.val(), password.val()).then(function (user) {
        console.log("Login via username/password successful");
        $("#authentication-message").text("Login via username/password successful!").show();
        }).catch(function (error) {
            console.log("Login via username/password failed")
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log($('#emailInput').val());
            console.log($('#passwordInput').val());
            console.log(errorCode);
            console.log(errorMessage);

            $("#authentication-message").text(errorMessage).show();
        });

    $("#authentication-password-input").val('');
});

$("#authentication-register-button").click(function (event) {
    event.preventDefault();
    var email = $("#authentication-email-input");
    var password = $("#authentication-password-input");

    firebase.auth().createUserWithEmailAndPassword(email.val(), password.val()).
        then(function (user) {
            console.log("Register via username/password successful");
            $("#authentication-message").text("Register via username/password successful").show();
        }).catch(function (error) {
            console.log("Register via username/password failed.")
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log(errorCode);
            console.log(errorMessage);

            $("#authentication-message").text(errorMessage).show();
        });

    $("#authentication-password-input").val('');
});

/*****************************************************/


/******************** Handle Logging Out ************/
$("#logout-button").click(function (event) {
    console.log("Logging current user out...");

    firebase.auth().signOut().catch(function (error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
    });

});
/******************************************************/

/********** Handle User signing in and out ************/
firebase.auth().onAuthStateChanged(function (user) {

    // user just signed in
    if (user) {

        console.log("Welcome!")

        userEmail = user.email;

        gatherUserData();

        userSignedIn();
    }
    else
    {
        console.log("Goodbye!")
        userSignedOut();
    }
});


function userSignedIn()
{
    $(".authentication").hide();
    $(".welcome-new-user").show();
    $("#logout-button").show();


    $(".main-page").show();
    
}

function gatherUserData()
{
    var userId = firebase.auth().currentUser.uid;

    db.read('/users/' + userId).once('value').then(function(snapshot){
        console.log(snapshot);
    });

}

function userSignedOut()
{
    $("#authentication-message").hide()
    $(".authentication").show();

    $(".welcome-new-user").hide();

    $("#logout-button").hide();

    $(".main-page").hide();
}
/******************************************/


/*********************** Handle Create Topic **************************/

$("#create-topic-button").click(function (event) {



});
/******************************************************************/