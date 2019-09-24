/**
 * Getting Started with Capture.
 * 
 * Reading and displaying an image from an attached Capture device. 
 */

import processing.video.*;

Capture cam;
PGraphics[] pgs = new PGraphics[60];
int index = 0;

void setup() {
  size(1280, 720);

  for(int i = 0; i < pgs.length; i++) {
    pgs[i] = createGraphics(1280, 720);
  }
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
    cam = new Capture(this, cameras[83]);
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
  
  PGraphics pg = pgs[index];
  pg.beginDraw();
  pg.image(cam, 0, 0, width, height);
  pg.endDraw();

  image(pgs[(index + 30) % pgs.length], 0, 0);

  index = (index + 1) % pgs.length;
  // The following does the same as the above image() line, but 
  // is faster when just drawing the image without any additional 
  // resizing, transformations, or tint.
  //set(0, 0, cam);
}
