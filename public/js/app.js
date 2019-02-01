/* global $ */
/* global firebase */

const firestore = firebase.firestore();
const settings = {/* your settings... */ timestampsInSnapshots: true};
firestore.settings(settings);

var currentUser = null; // currently logged in user object from database - has all needed fields we could want to work with, and the client owns all of these
var currentTopicId = null; // used to reference current topic that is being worked on, when generating new posts/comments.
var currentPostId = null;


/* MISC OTHER THINGS TO INITIALIZE */

$('#reply-comment-modal').modal({ show : false});

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

                
                var newDateJoined = new Date();

                console.log(newDateJoined);

                userRef.set({
                    email : user.email,
                    role : 0,
                    username : null,
                    dateJoined : newDateJoined,
                    profilePic : null
                });

                // update these if available
                userRef.update({
                    username : user.displayName,
                    profilePic : user.photoURL
                });
                
                console.log(userdb.data());
            }

            userRef.get().then(function(userdb){
                currentUser = userdb;
                console.log("Later: ");
                console.log(userdb.data());
                console.log(currentUser.id);
                console.log(currentUser.data());
    
                $(".authentication").hide();
    
                //$(".welcome-new-user").show(); //MPS
            
                $("#logout-button").show();
            
    
                console.log("Current username: " + currentUser.data().username);
    
                if(currentUser.data().username == null)
                {
                    console.log("here");
                    $(".missing-username").show();
                }
                else
                {
                    console.log("there");
                    fetchTopicsAndListenForNewOnes();
            
                    $(".main-page").show();
                }
            });

        });

    }
    else
    {

        // set local user to null to clear data:
        currentUser = null;
        
        $("#authentication-message").hide()
        $(".authentication").show();

        $(".welcome-new-user").hide();

        $("#logout-button").hide();

        $(".main-page").hide();
    }
});

/******************************************/


/*********************** Handle Create Topic **************************/

$("#publish-topic-button").click(function (event) {

    var newTopicName = $("#new-topic-name").val();

    //TODO: handle preventing overrwriting existing topics.

    var timestamp = new Date();

    firestore.collection("topics").add({
        ownerId : currentUser.id,
        topicName : newTopicName,
        username : currentUser.data().username,
        timestamp : timestamp
    });

});
/******************************************************************/



/********* Create Listener for new Topics *************************/
function fetchTopicsAndListenForNewOnes()
{
    
    $(".topic-listings").hide();
    $(".post-listings").hide();
    $(".post-display").hide();
    
    $("#table-of-topics").empty();
    
    $(".topic-listings").show();
            
    var topicRef = firestore.collection('topics');

    topicRef.orderBy('timestamp').onSnapshot(function(topics){
        $("#table-of-topics").empty();
        topics.forEach(function(topic){
            var topicData = topic.data();

            //$("#list-of-topics").append('<li id = "' + topic.id + '" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">' + topicData.topicName + ' <span class="badge badge-primary badge-pill button">' + 12 + '</span> </li>');
            
            //TODO: https://stackoverflow.com/questions/17147821/how-to-make-a-whole-row-in-a-table-clickable-as-a-link

            $("#table-of-topics").append('<tr><td id = "' + topic.id +'">' + topicData.topicName + '</td><td>' + topicData.username + '</td><td> 10 </td>');
            // TODO: add badge with number of posts! (cool)
            console.log(topicData.topicName);
        });
    });
}
/**************************************************************************/



/*********************** Listen for when user clicks a topic ***************/
$("#table-of-topics").click(function (event){
    // get topicId
    var topicId = $(event.target).attr('id');
    
    if(topicId != null)
    {
        var topicText = $(event.target).text();
        console.log("You clicked topic: " + topicId + " " + topicText);
    
        // we know what topic was clicked. hide topics and display selected topic only
    
        // hide topics
        $(".topic-listings").hide();
    
        // set topic header to current topic
        $("#current-topic-name").text(topicText);
        
        // Clear last table of posts
        $("#table-of-posts").empty();
    
        $(".topic-display").show();
    
        var postsRef = firestore.collection('posts');
    
        currentTopicId = topicId;
    
        postsRef.where("topicId", "==", topicId).orderBy('timestamp').onSnapshot(function(posts){
            
            console.log("Post Ref Activated!");
    
            $("#table-of-posts").empty();
            posts.forEach(function(post){
                console.log(post.data());
                var postData = post.data();
                //$("#list-of-posts").append('<li id="' + post.id + '" class="list-group-item list-group-item-action">' + postData.postName + '</li>');
                // TODO: Add likes and comment count
                $("#table-of-posts").append('<tr><td id = "' + post.id +'">' + postData.postName + '</td><td>' + postData.username + '</td><td> 10 </td><td> 10 </td>');
            });
    
        });   
    }

});
/**************************************************************************/

$("#go-back-to-topics").click(function(event){
    $(".topic-listings").show();
    $(".topic-display").hide();
});


$("#publish-post-button").click(function (event) {

    console.log("adding a new post");

    var newPostName = $("#new-post-name").val();
    var newPostContent = $("#new-post-content").val();

    //TODO: handle preventing overrwriting existing topics.

    console.log(currentUser.id);
    console.log(currentTopicId);
    console.log(newPostName);
    console.log(newPostContent);
    console.log(currentUser.data().username);

    var timestamp = new Date();

    firestore.collection("posts").add({
        ownerId : currentUser.id,
        topicId : currentTopicId,
        postName : newPostName,
        postContent : newPostContent,
        username : currentUser.data().username,
        timestamp : timestamp
    });

});



/******************************** Listen for user clicking on post **********************/

$("#table-of-posts").click(function (event){

    // get postId
    var postId = $(event.target).attr('id');
    var postName = $(event.target).text();


    if(postId != null)
    {
        currentPostId = postId;
    
        console.log("You clicked post: " + postId + " " + postName);
    
        // we know what post was clicked. hide posts and display selected post only
    
        // hide topic
        $(".topic-display").hide();
    
        // set topic header to current topic
        $("#current-post-name").text(postName);
        
        // Remove old comment list
        $("#list-of-comments").empty();
        
        // Reset post content until it loads.
        $("#current-post-content").empty();
        
        
    
        $(".post-display").show();
        
    
        var postsRef = firestore.collection('posts').doc(postId);
    
        postsRef.get().then(function(post){
            if(post.exists)
            {
                console.log(post.data());
                $("#current-post-content").text(post.data().postContent);
            }
            else
            {
                console.log("Document does not exist! Ahh!");
            }
        });
        
        $("#list-of-comments").empty();
        
        postRecursively(postId, 0);
    }
    

});



/******************************* Handle Nexted Comments, need to be able to call recursively ******************/
function postRecursively(parentId, Indentation)
{
    // find comments whose parent was that comment
    console.log("Here I am 1");
    console.log(parentId);
    var commentsRef = firestore.collection('comments');
    commentsRef.where("parentId", "==", parentId).orderBy('timestamp').onSnapshot(function(comments){
        // If the querry has results (there are subcomments)
        comments.forEach(function(comment){
           var commentData = comment.data();
           $("#" + comment.id).remove(); 
           $("#list-of-comments").append('<div id="' + comment.id + '" class="ml-' + Indentation + '">' + commentData.username + ": " + commentData.content + '\n</div>');
           postRecursively(comment.id, Indentation += 20);
        });
    });
}


$("#list-of-comments").click(function(event){
    // get postId
    var commentId = $(event.target).attr('id');

    if(commentId != null)
    {
        $('#reply-comment-modal').modal('show');
    }


    $("#publish-comment-reply-button").click(function(event){
        var replyContent = $("#reply-comment-content").val();
        $("#reply-comment-content").val("");


        var timestamp = new Date();

        firestore.collection("comments").add({
            ownerId : currentUser.id,
            parentId : commentId,
            content : replyContent,
            username: currentUser.data().username,
            timestamp : timestamp
        });

    });



});

/******************************* Add a new comment handler *******************************/
$("#publish-comment-button").click(function (event) {
    console.log("adding a new comment");

    var newCommentContent = $("#new-comment-content").val();

    //TODO: handle preventing overrwriting existing topics.

    console.log(currentUser.id);
    console.log(currentPostId);
    console.log(newCommentContent);

    var timestamp = new Date();

    firestore.collection("comments").add({
        ownerId : currentUser.id,
        parentId : currentPostId,
        content : newCommentContent,
        username: currentUser.data().username,
        timestamp : timestamp
    });
});



// Listener for changes to current user in database to update local copy accordingly:

$("#go-back-to-posts").click(function(event){
    $(".topic-display").show();
    $(".post-display").hide();
});



/****************************** Google Login Handler **************************/
$("#google-login-button").click(function (event) {
    console.log("Logging in via google...");
    var provider = new firebase.auth.GoogleAuthProvider();

    firebase.auth().signInWithPopup(provider).then(function (result) {
        
        $("#signInMethod").text("Google");

    }).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.

        console.log(error.code);
        console.log(error.message);
        $("#authentication-message").text(errorMessage);
    });

});

$("#change-username-submit").click(function (event) {

    var userRef = firestore.collection('users').doc(currentUser.id);
    var newUsername = $("#new-username-input").val();


    userRef.update({
        username: newUsername
    })
    .then(function() {
        console.log("Username successfully updated!");

        // Now hide the missing username and launch the main app!
        $(".missing-username").hide();

        fetchTopicsAndListenForNewOnes();
    
        $(".main-page").show();

    })
    .catch(function(error) {
        console.error("Error (this shouldnt happen): ", error);
    });

});


// TODO: a clear the slate function for when a user signs out that resets selected topic, etc. 


// TODO: Something clearly wrong when user registers, things are not as expected.