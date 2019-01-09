


$("#sign-in-submit-button").click(function (event) {
    var email = $("sign-in-email-input");
    var password = $("sign-in-password-input");
});


/* Handle User signing in and out */
firebase.auth().onAuthStateChanged(function (user) {

    // user just signed in
    if (user) {

        userSignedIn();
    }
    else
    {
        userSignedOut();
    }
});


function userSignedIn()
{
    $(".sign-in").hide();
    $(".sign-in-failure").hide();
}

function userSignedOut()
{
    $(".sign-in").show();
}
/******************************************/