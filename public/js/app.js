/* global $ */
/* global firebase */

const firestore = firebase.firestore();
const settings = {/* your settings... */ timestampsInSnapshots: true};
firestore.settings(settings);

var currentUser = null; // currently logged in user object from database - has all needed fields we could want to work with, and the client owns all of these
var currentTopicId = null; // used to reference current topic that is being worked on, when generating new posts/comments.
var currentPostId = null;
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

    //$(".welcome-new-user").show(); //MPS

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

    firestore.collection("topics").add({
        ownerId : currentUser.id,
        topicName : newTopicName,
        username : currentUser.data().username
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

    topicRef.onSnapshot(function(topics){
        $("#table-of-topics").empty();
        topics.forEach(function(topic){
            var topicData = topic.data();

            //$("#list-of-topics").append('<li id = "' + topic.id + '" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">' + topicData.topicName + ' <span class="badge badge-primary badge-pill button">' + 12 + '</span> </li>');
            
            //TODO: https://stackoverflow.com/questions/17147821/how-to-make-a-whole-row-in-a-table-clickable-as-a-link

            $("#table-of-topics").append('<tr><td id = "' + topic.id +'">' + topicData.topicName + '</td><td>' + currentUser.data().username + '</td><td> 10 </td>');
            // TODO: add badge with number of posts! (cool)
            console.log(topic.topicName);
        });
    });
}
/**************************************************************************/



/*********************** Listen for when user clicks a topic ***************/
$("#table-of-topics").click(function (event){
    // get topicId
    var topicId = $(event.target).attr('id');
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

    postsRef.where("topicId", "==", topicId).onSnapshot(function(posts){
        
        console.log("Post Ref Activated!");

        $("#table-of-posts").empty();
        posts.forEach(function(post){
            console.log(post.data());
            var postData = post.data();
            //$("#list-of-posts").append('<li id="' + post.id + '" class="list-group-item list-group-item-action">' + postData.postName + '</li>');
            // TODO: Add likes and comment count
            $("#table-of-posts").append('<tr><td id = "' + post.id +'">' + postData.postName + '</td><td>' + currentUser.data().username + '</td><td> 10 </td><td> 10 </td>');
        });

    });

    // Read from database?

    // Only print title of current topic:

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

    firestore.collection("posts").add({
        ownerId : currentUser.id,
        topicId : currentTopicId,
        postName : newPostName,
        postContent : newPostContent,
        username : currentUser.data().username
    });

});



/******************************** Listen for user clicking on post **********************/

$("#table-of-posts").click(function (event){

    // get postId
    var postId = $(event.target).attr('id');
    var postName = $(event.target).text();

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
            console.log("Document data: " + post.data());
            $("#current-post-content").text(post.data().postContent);
        }
        else
        {
            console.log("Document does not exist! Ahh!");
        }
    });
    
    postRecursively(postId, 0);
    
    /*
    var commentsRef = firestore.collection('comments');

    commentsRef.where("parentId", "==", postId).onSnapshot(function(comments){

        $("#list-of-comments").empty();
        
        
        comments.forEach(function(comment){
            console.log(comment.data());
            var commentData = comment.data();
            $("#list-of-comments").append('<div id="' + comment.id + '" class="">' + commentData.content + '\n</div>');
            postRecursively(comment.id);
        });

    });
    */

});



/******************************* Handle Nexted Comments, need to be able to call recursively ******************/
function postRecursively(parentId, Indentation)
{
    // find comments whose parent was that comment
    var commentsRef = firestore.collection('comments');
    commentsRef.where("parentId", "==", parentId).onSnapshot(function(comments){
        
        // If the querry has results (there are subcomments)
        if(comments.exists())
        {
            comments.forEach(function(comment){
               console.log(comment.data());
               
               var commentData = comment.data();
               $("#list-of-comments").append('<div id="' + comment.id + '" class=".ml-' + Indentation + '">' + commentData.content + '\n</div>');
               postRecursively(comment.id, Indentation += 20); 
                
            });
        }
        // otherwise nothing to see here!
    });
}

/******************************* Add a new comment handler *******************************/
$("#publish-comment-button").click(function (event) {
    console.log("adding a new comment");

    var newCommentContent = $("#new-comment-content").val();

    //TODO: handle preventing overrwriting existing topics.

    console.log(currentUser.id);
    console.log(currentPostId);
    console.log(newCommentContent);

    firestore.collection("comments").add({
        ownerId : currentUser.id,
        parentId : currentPostId,
        content : newCommentContent,
        username: currentUser.data().username
    });
});

// Listener for changes to current user in database to update local copy accordingly:

$("#go-back-to-posts").click(function(event){
    $(".topic-display").show();
    $(".post-display").hide();
});






// TODO: a clear the slate function for when a user signs out that resets selected topic, etc. 