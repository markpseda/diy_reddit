

var db = firebase.database();

var currentUser = null; // currently logged in user object from database - has all needed fields we could want to work with, and the client owns all of these


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

        var userId = user.uid;

        var userData = db.ref('users/' + userId);
        userData.once('value').then(function(userdb){
            // log current user's info in DB
            console.log(userdb.val());
    
            // if user exists, update database if new fields from auth object and they are not already set
            if(userdb.exists())
            {
                console.log("Normal user, lame-o");

                if(userdb.val().profilePic == null && user.photoURL != null)
                {
                    userData.update({
                        profilePic : user.photoURL
                    });
                }

            } // if user does not exist, create user with fields in auth object (for first sign in)
            else
            {
                console.log("New User, do things!");
                // The only fields that are AlWAYS present, set everything else to null by default
                userData.set({
                    email : user.email,
                    role : 0,
                    username : null,
                    dateJoined : null,
                    profilePic : null
                });

                // update these if available
                userData.update({
                    username : user.displayName,
                    profilePic : user.photoURL
                });
            }
        });

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


