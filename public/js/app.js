

const firestore = firebase.firestore();
const settings = {/* your settings... */ timestampsInSnapshots: true};
firestore.settings(settings);

var currentUser = null; // currently logged in user object from database - has all needed fields we could want to work with, and the client owns all of these
var currentTopic = null; // used to reference current topic that is being worked on, when generating new posts/comments.

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

    console.log("Is this happening?");

    // user just signed in
    if (user) {
        console.log("Welcome!")

        var userId = user.uid;

        var userRef = firestore.collection("users").doc(userId);

        userRef.get().then(function(userdb){
            if(userdb.exists)
            {
                console.log("Normal user, lame-o");

                if(userdb.data().profilePic == null && user.photoURL != null)
                {
                    userRef.update({
                        profilePic : user.photoURL
                    });
                }
            }
            else
            {
                console.log("New User, do things!");
                // The only fields that are AlWAYS present, set everything else to null by default
                userRef.set({
                    email : user.email,
                    role : 0,
                    username : null,
                    dateJoined : null,
                    profilePic : null
                });

                // update these if available
                userRef.update({
                    username : user.displayName,
                    profilePic : user.photoURL
                });
            }

        });

        // now that user is created/updated, set current user to these values.
        userRef.get().then(function(userdb){
            currentUser = userdb;
            console.log(currentUser.id);
            console.log(currentUser.data());
        });

        userSignedIn();
    }
    else
    {
        console.log("Goodbye!")

        // set local user to null to clear data:
        currentUser = null;
        userSignedOut();
    }
});


function userSignedIn()
{
    $(".authentication").hide();
    $(".welcome-new-user").show();
    $("#logout-button").show();

    fetchTopicsAndListenForNewOnes();


    $(".main-page").show();
    
}


function userSignedOut()
{
    // disable db callbacks
    //firestore.off();

    $("#authentication-message").hide()
    $(".authentication").show();

    $(".welcome-new-user").hide();

    $("#logout-button").hide();

    $(".main-page").hide();
}
/******************************************/


/*********************** Handle Create Topic **************************/

$("#publish-topic-button").click(function (event) {

    var newTopicName = $("#new-topic-name").val();

    //TODO: handle preventing overrwriting existing topics.

    firestore.collection("topics").doc(newTopicName).set({
        ownerId : currentUser.id
    });

});
/******************************************************************/



/********* Create Listener for new Topics *************************/
function fetchTopicsAndListenForNewOnes()
{
    var topicRef = firestore.collection('topics');

    topicRef.onSnapshot(function(topicData){
        $("#list-of-topics").empty();
        topicData.forEach(function(topic){
            $("#list-of-topics").append('<li class="list-group-item list-group-item-action">' + topic.id + '</li>');
            // TODO: add badge with number of posts! (cool)
            console.log(topic.id);
            console.log(topic.data());
        });
    });

}
/**************************************************************************/



/*********************** Listen for when user clicks a topic ***************/
$("#list-of-topics").click(function (event){
    // get topicId
    var topicId = $(event.target).text();
    console.log("You clicked topic: " + topicId);

    // we know what topic was clicked. hide topics and display selected topic only

    // hide topics
    $(".topic-listings").hide();

    // set topic header to current topic
    $("#current-topic-name").text(topicId);

    $("#topic-display").show();

    var postsRef = firestore.collection('posts');

    postsRef.where("topicId", "==", topicId).onSnapshot(function(posts){

        $("#list-of-posts").empty();
        posts.forEach(function(post){
            console.log(post.data());
            var postData = post.data();
            $("#list-of-posts").append('<li class="list-group-item list-group-item-action">' + postData.title + '</li>');
        });

    });

    // Read from database?

    // Only print title of current topic:


});
/**************************************************************************/

$("#go-back-to-topics").click(function(event){
    $(".topic-listings").show();
    $("#topic-display").hide();
});


$("#publish-post-button").click(function (event) {

    var newTopicName = $("#new-post-name").val();
    var newTopicContent = $("new-post-content").val();

    //TODO: handle preventing overrwriting existing topics.

    firestore.collection("posts").add({
        topicId : currentUser.id
    });

});

// Listener for changes to current user in database to update local copy accordingly:








// TODO: a clear the slate function for when a user signs out that resets selected topic, etc. 