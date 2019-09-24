// Copyright (c) 2018 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
PoseNet example using p5.js
=== */

let video;
let poseNet;
let poses = [];
let count = 0;
const SIZE = 256;

function setup() {
  createCanvas(SIZE * 2, SIZE);
  // createCanvas(640, 180);
  // video = createVideo(['Basic Locking Tutorial  Nishant Nair  DanceFreaX.mp4']);
  video = createVideo(['drake.mp4']);
  // video = createVideo(['ppap.mp4']);
  // video = createVideo(['D01T01_Ros_sync_AJA_1.mp4']);
  // video = createCapture(VIDEO);
  // video.size(width/2, height);
  // video.speed(0.25);
  // video.play();

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, modelReady);
  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on('pose', function(results) {
    poses = results;
  });
  // Hide the video element, and just show the canvas
  video.hide();
}

function mousePressed() {
  video.play();
}

function modelReady() {
  select('#status').html('Model Loaded');
}

function draw() {
  background(0);
  image(video, SIZE, 0, SIZE, SIZE);
  // translate(width/2, 0);
  scale(SIZE / video.width, SIZE / video.height);
  strokeWeight(4);

  // We can call both functions to draw all keypoints and the skeletons
  drawSkeleton();
  drawKeypoints();

  if(poses.length > 0 && frameCount % 4 == 0) {
    // saveCanvas('myCanvas' + str(count++), 'jpg');
    // console.log('myCanvas' + str(count++).padStart(5, '0'));
  }
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints()  {
  // Loop through all the poses detected
  for (let i = 0; i < 1 && i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    let pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j++) {
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      let keypoint = pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.0) {
        fill(255, 0, 0);
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 20, 20);
      }
    }
  }
}

// A function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  for (let i = 0; i < 1 && i < poses.length; i++) {
    let skeleton = poses[i].skeleton;
    // For every skeleton, loop through all body connections
    for (let j = 0; j < skeleton.length; j++) {
      let partA = skeleton[j][0];
      let partB = skeleton[j][1];
      stroke(255);
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  }
}