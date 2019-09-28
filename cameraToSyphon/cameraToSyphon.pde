 /**
 * Getting Started with Capture.
 * 
 * Reading and displaying an image from an attached Capture device. 
 */

import processing.video.*;
import codeanticode.syphon.*;

Capture cam;
SyphonServer server;

void setup() {
  size(1280, 720, P3D);
  server = new SyphonServer(this, "Processing Syphon");

  String[] cameras = Capture.list();

  if (cameras == null) {
    println("Failed to retrieve the list of available cameras, will try the default...");
    cam = new Capture(this, 640, 480);
  } if (cameras.length == 0) {
    println("There are no cameras available for capture.");
    exit();
  } else {
    println("Available cameras:");
    printArray(cameras);

    // The camera can be initialized directly using an element
    // from the array returned by list():
    cam = new Capture(this, 960, 600, "USB Capture HDMI", 30);
    // Or, the settings can be defined based on the text in the list
    //cam = new Capture(this, 640, 480, "Built-in iSight", 30);
    
    // Start capturing the images from the camera
    cam.start();
  }
}

void draw() {
  if (cam.available() == true) {
    cam.read();
  }
  background(0);
  translate(width/2, height/2);
  //scale(-1, 1);
  translate(-width/2, -height/2);
  int w = 92;
  int h = -133;
  image(cam, w, h, width-w*2, height-h*2);
  server.sendScreen();
  // The following does the same as the above image() line, but 
  // is faster when just drawing the image without any additional 
  // resizing, transformations, or tint.
  //set(0, 0, cam);
}
