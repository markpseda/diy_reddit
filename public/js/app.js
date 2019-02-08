/* global $ */
/* global firebase */

const firestore = firebase.firestore();
const settings = {/* your settings... */ timestampsInSnapshots: true};
firestore.settings(settings);

var currentUser = null; // currently logged in user object from database - has all needed fields we could want to work with, and the client owns all of these
var currentTopicId = null; // used to reference current topic that is being worked on, when generating new posts/comments.
var currentPostId = null;
var currentCommentId = null;


/* MISC OTHER THINGS TO INITIALIZE */

$('#reply-comment-modal').modal({ show : false});

/********** Hande Password Login **********************/
$("#authentication-login-button").click(function (event) {
    event.preventDefault();
    let email = $("#authentication-email-input");
    let password = $("#authentication-password-input");

    firebase.auth().signInWithEmailAndPassword(email.val(), password.val()).then(function (user) {
        console.log("Login via username/password successful");
        $("#authentication-message").text("Login via username/password successful!").show();
        }).catch(function (error) {
            console.log("Login via username/password failed");
            let errorCode = error.code;
            let errorMessage = error.message;
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
    let email = $("#authentication-email-input");
    let password = $("#authentication-password-input");

    firebase.auth().createUserWithEmailAndPassword(email.val(), password.val()).
        then(function (user) {
            console.log("Register via username/password successful");
            $("#authentication-message").text("Register via username/password successful").show();
        }).catch(function (error) {
            console.log("Register via username/password failed.")
            let errorCode = error.code;
            let errorMessage = error.message;
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

    $(".topic-listings").hide();
    $(".topic-display").hide();
    $(".post-diplay").hide();

    firebase.auth().signOut().catch(function (error) {
        let errorCode = error.code;
        let errorMessage = error.message;
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

        let userId = user.uid;

        let userRef = firestore.collection("users").doc(userId);

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

                
                let newDateJoined = Date.now();

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
                    $("#navbar-content").text("Welcome: " + currentUser.data().username);
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

        $("#navbar-content").text("");
        
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

    let newTopicName = $("#new-topic-name").val();

    //TODO: handle preventing overrwriting existing topics.

    let timestamp = Date.now();

    firestore.collection("topics").add({
        ownerId : currentUser.id,
        topicName : newTopicName,
        username : currentUser.data().username,
        timestamp : timestamp,
        postCount : 0
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
            
    let topicRef = firestore.collection('topics');

    topicRef.orderBy('timestamp').onSnapshot(function(topics){
        $("#table-of-topics").empty();
        topics.forEach(function(topic){
            let topicData = topic.data();

            let date = new Date(topicData.timestamp);
            $("#table-of-topics").append('<tr id = "' + topic.id +'" class = "clickable"><td>' + topicData.topicName + '</td><td>' + topicData.username + '</td><td>' + date + '</td><td>' + topicData.postCount + '</td>');
            // TODO: add badge with number of posts! (cool)
            console.log(topicData.topicName);
        });
    });
}
/**************************************************************************/



/*********************** Listen for when user clicks a topic ***************/
$("#table-of-topics").click(function (event){
    // get topicId

    let topicId = $(event.target).parent().attr('id');
    let topicRow = $(event.target).parent().children()[0];
    let topicName = $(topicRow).text();
    console.log("topic name: " + topicName);
    
    if(topicId != null)
    {
        console.log("You clicked topic: " + topicId + " " + topicName);
    
        // we know what topic was clicked. hide topics and display selected topic only
    
        // hide topics
        $(".topic-listings").hide();
    
        // set topic header to current topic
        $("#current-topic-name").text(topicName);
        
        // Clear last table of posts
        $("#table-of-posts").empty();
    
        $(".topic-display").show();
    
        let postsRef = firestore.collection('posts');
    
        currentTopicId = topicId;
    
        postsRef.where("topicId", "==", topicId).orderBy('timestamp').onSnapshot(function(posts){
            
            console.log("Post Ref Activated!");
    
            $("#table-of-posts").empty();
            posts.forEach(function(post){
                console.log(post.data());
                let postData = post.data();

                let date = new Date(postData.timestamp);
                $("#table-of-posts").append('<tr class="clickable" id = "' + post.id +'"><td >' + postData.postName + '</td><td>' + postData.username + '</td><td>' + date  + '</td><td>' + post.data().likeCount + '</td><td>' + post.data().commentCount + '</td>');
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

    let newPostName = $("#new-post-name").val();
    let newPostContent = $("#new-post-content").val();

    $("#new-post-name").val("");
    $("#new-post-content").val("");


    console.log(currentUser.id);
    console.log(currentTopicId);
    console.log(newPostName);
    console.log(newPostContent);
    console.log(currentUser.data().username);

    let timestamp = Date.now();

    firestore.collection("posts").add({
        ownerId : currentUser.id,
        topicId : currentTopicId,
        postName : newPostName,
        postContent : newPostContent,
        username : currentUser.data().username,
        timestamp : timestamp,
        likeCount : 0,
        commentCount : 0
    });

    incrementPostCount();

});



/******************************** Listen for user clicking on post **********************/

$("#table-of-posts").click(function (event){

    // get postId
    //console.log("NEW ATTEMPT HERE");
    //console.log($(event.target).parent());
    //console.log($(event.target).parent().children()[0]);
    //console.log($(event.target).parent().children()[0].innerTEXT);
    let postId = $(event.target).parent().attr('id');
    let postRow = $(event.target).parent().children()[0];
    let postName = $(postRow).text();

    console.log(postId);
    console.log(postName);
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
        
    
        let postsRef = firestore.collection('posts').doc(postId);
    
        postsRef.onSnapshot(function(post){
            if(post.exists)
            {
                console.log(post.data());
                $("#current-post-content").text(post.data().postContent);
                $("#current-post-name").text(post.data().postName + " [Likes: " + post.data().likeCount + "]");
            }
            else
            {
                console.log("Document does not exist! Ahh!");
            }
        });
        
        //$("#list-of-comments").empty();
        
        postRecursively(postId, 0);
    }
    

});


/******************************* Handle Nexted Comments, need to be able to call recursively ******************/
function postRecursively(parentId, Indentation)
{
    if(Indentation == 0)
    {
        console.log("EMPPTYING");
        $("#list-of-comments").empty();
    }
    // find comments whose parent was that comment
    console.log(parentId);
    console.log(Indentation);

    let commentsRef = firestore.collection('comments');
    commentsRef.where("parentId", "==", parentId).orderBy('timestamp').get().then(function(comments){
        // If the querry has results (there are subcomments)
        comments.forEach(function(comment){
            console.log("ParentID: " + parentId);
            console.log("My ID: " + comment.id);
            console.log(comment.data());
            let commentData = comment.data();
            let date = new Date(commentData.timestamp);
            let appendId = "";
            if(parentId == currentPostId) appendId = "#list-of-comments";
            else appendId = `#${parentId}`;
           $(appendId).append('<div class="ml-' + Indentation + '"><span class="underline">' + commentData.username + " (" + date + "): </span><p id=" + comment.id +">" + commentData.content + '</p></div>');
            postRecursively(comment.id, 2);
        });
    });
    
}


$("#list-of-comments").click(function(event){
    // get postId
    let commentId = $(event.target).attr('id');

    if(commentId != null)
    {
        currentCommentId = commentId;
        $('#reply-comment-modal').modal('show');
    }
});

$("#publish-comment-reply-button").click(function(event){
    let replyContent = $("#reply-comment-content").val();
    $("#reply-comment-content").val("");

    console.log("commentId: " + currentCommentId);

    let timestamp = Date.now();

    firestore.collection("comments").add({
        ownerId : currentUser.id,
        parentId : currentCommentId,
        content : replyContent,
        username: currentUser.data().username,
        timestamp : timestamp
    });

    currentCommentId = null;

    //$("#list-of-comments").empty();
    incrementCommentCount();
    console.log("MEEP" + currentPostId);
    postRecursively(currentPostId, 0);
});

/******************************* Add a new comment handler *******************************/
$("#publish-comment-button").click(function (event) {
    console.log("adding a new comment");

    let newCommentContent = $("#new-comment-content").val();
    $("#new-comment-content").val("");

    //TODO: handle preventing overrwriting existing topics.

    console.log(currentUser.id);
    console.log(currentPostId);
    console.log(newCommentContent);

    let timestamp = Date.now();

    firestore.collection("comments").add({
        ownerId : currentUser.id,
        parentId : currentPostId,
        content : newCommentContent,
        username: currentUser.data().username,
        timestamp : timestamp
    });

    incrementCommentCount();
    postRecursively(currentPostId, 0);
});



// Listener for changes to current user in database to update local copy accordingly:

$("#go-back-to-posts").click(function(event){
    $(".topic-display").show();
    $(".post-display").hide();
});



/****************************** Google Login Handler **************************/
$("#google-login-button").click(function (event) {
    console.log("Logging in via google...");
    let provider = new firebase.auth.GoogleAuthProvider();

    firebase.auth().signInWithPopup(provider).then(function (result) {
        
        $("#signInMethod").text("Google");

    }).catch(function (error) {
        // Handle Errors here.
        let errorCode = error.code;
        let errorMessage = error.message;
        // The email of the user's account used.

        console.log(error.code);
        console.log(error.message);
        $("#authentication-message").text(errorMessage);
    });

});

$("#change-username-submit").click(function (event) {

    let userRef = firestore.collection('users').doc(currentUser.id);
    let newUsername = $("#new-username-input").val();


    userRef.update({
        username: newUsername
    })
    .then(function() {
        console.log("Username successfully updated!");

        // Now hide the missing username and launch the main app!
        $(".missing-username").hide();

        $("#navbar-content").text("Welcome: " + newUsername);

        fetchTopicsAndListenForNewOnes();
    
        $(".main-page").show();

    })
    .catch(function(error) {
        console.error("Error (this shouldnt happen): ", error);
    });

});


$("#like-post").click(function(event){
    let postsRef = firestore.collection('posts').doc(currentPostId);

    firestore.runTransaction(function(transaction) 
    {
        return transaction.get(postsRef).then(function(post) 
        {
          if (!post.exists) 
          {
            throw new Error('Post does not exist!');
          }
          const newLikeCount = post.data().likeCount + 1;
          transaction.update(postsRef, { likeCount: newLikeCount });
        });
    }).then(function() {
        console.log('Updated Likes!');
    }).catch(function(error) {
        console.log('Update Likes failed: ', error);
    });
});

function incrementCommentCount()
{
    let postsRef = firestore.collection('posts').doc(currentPostId);

    firestore.runTransaction(function(transaction) 
    {
        return transaction.get(postsRef).then(function(post) 
        {
          if (!post.exists) 
          {
            throw new Error('Post does not exist!');
          }
          const newCommentCount = post.data().commentCount + 1;
          transaction.update(postsRef, { commentCount: newCommentCount});
        });
    }).then(function() {
        console.log('Updated commentCount!');
    }).catch(function(error) {
        console.log('Update commentCount failed: ', error);
    });
}

function incrementPostCount()
{
    let topicsRef = firestore.collection('topics').doc(currentTopicId);

    firestore.runTransaction(function(transaction) 
    {
        return transaction.get(topicsRef).then(function(topic) 
        {
          if (!topic.exists) 
          {
            throw new Error('topic does not exist!');
          }
          const newPostCount = topic.data().postCount + 1;
          transaction.update(topicsRef, { postCount: newPostCount});
        });
    }).then(function() {
        console.log('Updated postCount!');
    }).catch(function(error) {
        console.log('Update postCount failed: ', error);
    });
}