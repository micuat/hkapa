import javax.script.ScriptEngineManager;
import javax.script.ScriptEngine;
import javax.script.ScriptContext;
import javax.script.ScriptException;
import javax.script.Invocable;
import javax.script.Compilable;

import java.lang.NoSuchMethodException;
import java.lang.reflect.*;

import java.util.ArrayList;
import java.util.List;

import java.io.IOException;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;

import processing.core.PApplet;
import processing.opengl.PGraphics2D;
import processing.awt.PSurfaceAWT;
import javax.swing.JPanel;
import javax.swing.JFrame;
import java.awt.Color;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;

import hypermedia.net.*;

import http.*;
import java.util.logging.Level;

import websockets.*;

import oscP5.*;
import netP5.*;

import processing.sound.*;

SimpleHTTPServer httpServer;

WebsocketServer wsServer;

OscP5 oscP5;
NetAddress myRemoteLocation;

public PGraphics renderPg;
JFrame frame;
JPanel panel;

public FFT fft;
AudioIn audioInput;

private static ScriptEngineManager engineManager;
private static ScriptEngine nashorn;

public static String VERSION = "0.1";

private static ArrayList<String> libPaths = new ArrayList<String>();
private static ArrayList<String> scriptPaths = new ArrayList<String>();
private static long prevModified;

public String drawMode = "p2d"; // "p2d" / "webgl"
public int newWidth, newHeight;

public PApplet that = this;

public String folderName = "";
public int updateDelayMillis = 5;

boolean libInited = false;

float frameRate() {
  return frameRate;
}

UDP udp;  // define the UDP object

public JSONObject json = new JSONObject();
public String jsonString = "";
public String jsonUiString = "{}";
/**
 * init
 */
void setup() {
  //size(1280, 720);
  fullScreen();
  //fullScreen(2);
  frame = (JFrame)((PSurfaceAWT.SmoothCanvas) getSurface().getNative()).getFrame();
  frame.removeNotify();
  frame.setUndecorated(true);
  frame.setLayout(null);
  frame.addNotify();

  renderPg = createGraphics(width, height);

  JPanel panel = new JPanel() {
    @Override
      protected void paintComponent(Graphics graphics) {
      if (graphics instanceof Graphics2D) {
        Graphics2D g2d = (Graphics2D) graphics;
        g2d.drawImage(renderPg.image, 0, 0, null);
      }
    }
  };

  frame.setContentPane(panel);

  udp = new UDP( this, 8051 );
  udp.listen( true );

  OscProperties op = new OscProperties();
  op.setListeningPort(13000);
  op.setDatagramSize(50000);
  oscP5 = new OscP5(this, op);  
  myRemoteLocation = new NetAddress("192.168.0.100", 13000);

  // set the logger level to info
  httpServer.setLoggerLevel(Level.INFO);
  // create a server
  httpServer = new SimpleHTTPServer(this);
  httpServer.serveAll("");

  wsServer = new WebsocketServer(this, 8025, "/staebe");

  audioInput = new AudioIn(this, 0);
  audioInput.start();
  int bands = 4;
  fft = new FFT(this, bands);
  fft.input(audioInput);

  //surface.setResizable(true);
  frameRate(60);

  folderName = "geom";
  String[] libLines = loadStrings(folderName + "/libraries.config");
  for (String l : libLines) {
    if (l.equals("") == false) {
      libPaths.add(sketchPath("libs/" + l));
    }
  }
  scriptPaths.add(sketchPath(folderName + "/sketch.js"));
}

void initNashorn() {
  String[] options = new String[] { "--language=es6" };
  jdk.nashorn.api.scripting.NashornScriptEngineFactory  factory = new jdk.nashorn.api.scripting.NashornScriptEngineFactory();
  nashorn = (jdk.nashorn.api.scripting.NashornScriptEngine) factory.getScriptEngine(options);

  try {
    // init placehoders
    nashorn.eval("var pApplet = {}; var globalSketch = {};");
    Object global = nashorn.eval("this.pApplet");
    Object jsObject = nashorn.eval("Object");
    // calling Object.bindProperties(global, this);
    // which will "bind" properties of the PApplet object
    ((Invocable)nashorn).invokeMethod(jsObject, "bindProperties", global, (PApplet)this);

    // Array.prototype.includes
    // nashorn.eval("Array.prototype.includes = function (val){return this.indexOf(val) != -1;}");

    // console.log is print
    nashorn.eval("var console = {}; console.log = print;");

    nashorn.eval("var alternateSketch = new function(){};");

    // PConstants
    nashorn.eval("var PConstantsFields = Packages.processing.core.PConstants.class.getFields();");
    nashorn.eval("for(var i = 0; i < PConstantsFields.length; i++) {alternateSketch[PConstantsFields[i].getName()] = PConstantsFields[i].get({})}");

    // **_ARROW in p5.js
    nashorn.eval("alternateSketch.UP_ARROW = alternateSketch.UP");
    nashorn.eval("alternateSketch.DOWN_ARROW = alternateSketch.DOWN");
    nashorn.eval("alternateSketch.LEFT_ARROW = alternateSketch.LEFT");
    nashorn.eval("alternateSketch.RIGHT_ARROW = alternateSketch.RIGHT");

    // static methods
    nashorn.eval("var PAppletFields = pApplet.class.getMethods();");
    nashorn.eval(
      "for(var i = 0; i < PAppletFields.length; i++) {" +
      "var found = false;" +
      "  for(var prop in pApplet) {" +
      "    if(prop == PAppletFields[i].getName() ) found = true;" +
      "  }" +
      "  if(!found){"+
      "    alternateSketch[PAppletFields[i].getName()] = PAppletFields[i];" +
      "    eval('alternateSketch[PAppletFields[i].getName()] = function() {" +
      "      if(arguments.length == 0) return Packages.processing.core.PApplet.'+PAppletFields[i].getName()+'();" +
      "      if(arguments.length == 1) return Packages.processing.core.PApplet.'+PAppletFields[i].getName()+'(arguments[0]);" +
      "      if(arguments.length == 2) return Packages.processing.core.PApplet.'+PAppletFields[i].getName()+'(arguments[0], arguments[1]);" +
      "      if(arguments.length == 3) return Packages.processing.core.PApplet.'+PAppletFields[i].getName()+'(arguments[0], arguments[1], arguments[2]);" +
      "      if(arguments.length == 4) return Packages.processing.core.PApplet.'+PAppletFields[i].getName()+'(arguments[0], arguments[1], arguments[2], arguments[3]);" +
      "      if(arguments.length == 5) return Packages.processing.core.PApplet.'+PAppletFields[i].getName()+'(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]);" +
      "    }')" +
      "  }" +
      "}");

    // overwrite random
    nashorn.eval("alternateSketch.random = function() {" +
      "  if(arguments.length == 1) {" +
      "    if(Array.isArray(arguments[0])) {" +
      "      let index = Math.floor(Math.random() * arguments[0].length);" +
      "      return arguments[0][index];" +
      "    }" +
      "    else {" +
      "      return Math.random() * arguments[0];" +
      "    }" +
      "  }" +
      "  else if(arguments.length == 2) return alternateSketch.map(Math.random(), 0, 1, arguments[0], arguments[1]);" +
      "}");

    // overwrite randomGaussian
    nashorn.eval("alternateSketch.randomGaussian = function (m, v) {" +
      "  if (m === undefined) return pApplet.randomGaussian();" +
      "  else if (v === undefined) return pApplet.randomGaussian() + m;" +
      "  else return pApplet.randomGaussian() * v + m;" +
      "}");

    // overwrite constrain (int/float arity signature problem)
    nashorn.eval("alternateSketch.constrain = function(x, xl, xh) {" +
      "  return Math.min(Math.max(x, xl), xh);" +
      "}");

    // overwrite ellipse for short handed circle
    nashorn.eval("alternateSketch.ellipse = function() {" +
      "  if(arguments.length == 3) return pApplet.ellipse(arguments[0], arguments[1], arguments[2], arguments[2]);" +
      "  if(arguments.length == 4) return pApplet.ellipse(arguments[0], arguments[1], arguments[2], arguments[3]);" +
      "}");

    // createVector
    nashorn.eval("alternateSketch.createVector = function() {" +
      "  let x = 0, y = 0, z = 0;" +
      "  if(arguments.length == 2) {x = arguments[0]; y = arguments[1];}" +
      "  else if(arguments.length == 3) {x = arguments[0]; y = arguments[1]; z = arguments[2];}" +
      "  return new Packages.processing.core.PVector(x, y, z);" +
      "}");

    // push / pop
    nashorn.eval("alternateSketch.push = function() {alternateSketch.pushMatrix(); alternateSketch.pushStyle();}");
    nashorn.eval("alternateSketch.pop = function() {alternateSketch.popMatrix(); alternateSketch.popStyle();}");

    // createCanvas reads draw mode
    nashorn.eval("alternateSketch.P2D = 'p2d';");
    nashorn.eval("alternateSketch.WEBGL = 'webgl';");
    nashorn.eval("alternateSketch.createCanvas = function(w, h, mode) {"+
      "  alternateSketch.width = w; alternateSketch.height = h;" +
      "  pApplet.newWidth = w; pApplet.newHeight = h; pApplet.drawMode = mode;" +
      "}");

    // define const to tell if it's livejs or p5.js
    nashorn.eval("alternateSketch.isLiveJs = true;");

    // utility
    // avoids standard functions like setup/draw/... as they will be overwritten in the script
    // also avoids ellipse, color to define separately
    nashorn.eval("this.isReservedFunction = function (str) {" +
      "  var isArgument_ = function (element) { return str === element; };" +
      "  return ['ellipse', 'color', 'random', 'randomGaussian', 'setup', 'draw', 'keyPressed', 'keyReleased', 'keyTyped', 'mouseClicked', 'mouseDragged', 'mouseMoved', 'mousePressed', 'mouseReleased', 'mouseWheel', 'oscEvent'].some(isArgument_);" +
      "}");

    // p5js entry point
    nashorn.eval("var p5 = function(sketch) {sketch(alternateSketch); globalSketch = alternateSketch; return alternateSketch;}");

    // p5.Vector
    nashorn.eval("p5.Vector = Packages.processing.core.PVector;");
    // random2D dirty fix - all the PVector functions should be bound to p5.Vector
    nashorn.eval("p5.Vector.random2D = function() { return Packages.processing.core.PVector.random2D(); }");
    // random3D dirty fix
    nashorn.eval("p5.Vector.random3D = function() { return Packages.processing.core.PVector.random3D(); }");

    // overwrite color (int/float arity signature problem)
    // does not support hex/string colors
    // but this is SLOW
    nashorn.eval("alternateSketch.color = function() {" +
      "  if(arguments.length == 1) return pApplet.color(new java.lang.Float(arguments[0]));" +
      "  else if(arguments.length == 2) return pApplet.color(new java.lang.Float(arguments[0]), new java.lang.Float(arguments[1]));" +
      "  else if(arguments.length == 3) return pApplet.color(new java.lang.Float(arguments[0]), new java.lang.Float(arguments[1]), new java.lang.Float(arguments[2]));" +
      "  else if(arguments.length == 4) return pApplet.color(new java.lang.Float(arguments[0]), new java.lang.Float(arguments[1]), new java.lang.Float(arguments[2]), new java.lang.Float(arguments[3]));" +
      "}");
  }
  catch (Exception e) {
    e.printStackTrace();
  }
}

void draw() {
  //surface.setLocation(100, 100);
  if (libInited == false) {
    initNashorn();
    try {
      readLibs(libPaths);
      libInited = true;
    }
    catch (IOException e) {
      e.printStackTrace();
    }
  }
  try {
    readFiles(scriptPaths);
  }
  catch (IOException e) {
    e.printStackTrace();
  }

  try {
    nashorn.eval("for(var prop in pApplet) {if(!this.isReservedFunction(prop)) {alternateSketch[prop] = pApplet[prop]}}");
    //nashorn.eval("alternateSketch.jsonString = pApplet.jsonString");
    if (drawMode == "webgl") {
      translate(width / 2, height / 2);
    }
    if (nashorn.eval("alternateSketch.draw") != null)
      nashorn.eval("alternateSketch.draw();");
  }
  catch (ScriptException e) {
    e.printStackTrace();
  }
  catch (Exception e) {
    e.printStackTrace();
  }
  frame.setBackground(new Color(0, 0, 0, 0));
}

private static byte[] encoded;
public static String readFile(String path) throws IOException {
  long lastModified = Files.getLastModifiedTime(Paths.get(path)).toMillis();
  if (prevModified < lastModified || encoded == null) {
    encoded = Files.readAllBytes(Paths.get(path));
    println("updated at " + lastModified);
    prevModified = lastModified;

    try {
      nashorn.eval("for(var prop in pApplet) {if(!this.isReservedFunction(prop)) {alternateSketch[prop] = pApplet[prop]}}");
      nashorn.eval(new String(encoded, StandardCharsets.UTF_8));
      nashorn.eval("alternateSketch.setup();");
      print("script loaded in java");
    }
    catch (ScriptException e) {
      e.printStackTrace();
    }
    catch (Exception e) {
      e.printStackTrace();
    }
  }
  return new String(encoded, StandardCharsets.UTF_8);
}

public void readLibs(ArrayList<String> paths) throws IOException {
  println("loading libraries");

  for (String path : paths) {
    encoded = Files.readAllBytes(Paths.get(path));

    try {
      nashorn.eval(new String(encoded, StandardCharsets.UTF_8));
    }
    catch (ScriptException e) {
      e.printStackTrace();
    }
    catch (Exception e) {
      e.printStackTrace();
    }
  }
}

public void readFiles(ArrayList<String> paths) throws IOException {
  long lastModified = 0;
  for (String path : paths) {
    long modified = Files.getLastModifiedTime(Paths.get(path)).toMillis();
    if (modified > lastModified) lastModified = modified;
  }
  if (prevModified < lastModified || encoded == null) {
    println("updated at " + lastModified);
    prevModified = lastModified;

    try {
      nashorn.eval("for(var prop in pApplet) {if(!this.isReservedFunction(prop)) {alternateSketch[prop] = pApplet[prop]}}");
    }
    catch (ScriptException e) {
      e.printStackTrace();
    }
    catch (Exception e) {
      e.printStackTrace();
    }
    for (String path : paths) {
      encoded = Files.readAllBytes(Paths.get(path));

      try {
        String script = new String(encoded, StandardCharsets.UTF_8);
        nashorn.eval(script);
      }
      catch (AssertionError e) {
        // most likely syntax error
        e.printStackTrace();
      }
      catch (ScriptException e) {
        e.printStackTrace();
      }
      catch (Exception e) {
        e.printStackTrace();
      }
    }
    try {
      nashorn.eval("if(alternateSketch.preload !== undefined) alternateSketch.preload();");
      nashorn.eval("alternateSketch.setup();");
      //surface.setSize(newWidth, newHeight);
    }
    catch (ScriptException e) {
      e.printStackTrace();
    }
    catch (Exception e) {
      e.printStackTrace();
    }
  }
}

/**
 * To perform any action on datagram reception, you need to implement this 
 * handler in your code. This method will be automatically called by the UDP 
 * object each time he receive a nonnull message.
 * By default, this method have just one argument (the received message as 
 * byte[] array), but in addition, two arguments (representing in order the 
 * sender IP address and his port) can be set like below.
 */
int saveCount = 0;
// void receive( byte[] data ) {       // <-- default handler
void receive( byte[] data, String ip, int port ) {  // <-- extended handler


  // get the "real" message =
  // forget the ";\n" at the end <-- !!! only for a communication with Pd !!!
  data = subset(data, 0, data.length);
  jsonString = new String( data );

  json = parseJSONObject("{"+jsonString+"}");

  //if(saveCount < 6000) {
  //  String [] s = {jsonString};
  //  saveStrings(str(saveCount++) + ".json", s);
  //}
  // print the result
  //println( "receive: \""+message+"\" from "+ip+" on port "+port );
}

void keyPressed(KeyEvent event) {
  try {
    nashorn.eval("for(var prop in pApplet) {if(!this.isReservedFunction(prop)) {globalSketch[prop] = pApplet[prop]}}");

    nashorn.eval("var pAppletEvent = {};");
    Object pAppletEvent = nashorn.eval("this.pAppletEvent");
    Object jsObject = nashorn.eval("Object");
    ((Invocable)nashorn).invokeMethod(jsObject, "bindProperties", pAppletEvent, event);

    nashorn.eval("if(globalSketch.keyPressed != null) globalSketch.keyPressed(this.pAppletEvent)");
  }
  catch (Exception e) {
    e.printStackTrace();
  }
}

void keyReleased(KeyEvent event) {
  try {
    nashorn.eval("for(var prop in pApplet) {if(!this.isReservedFunction(prop)) {globalSketch[prop] = pApplet[prop]}}");

    nashorn.eval("var pAppletEvent = {};");
    Object pAppletEvent = nashorn.eval("this.pAppletEvent");
    Object jsObject = nashorn.eval("Object");
    ((Invocable)nashorn).invokeMethod(jsObject, "bindProperties", pAppletEvent, event);

    nashorn.eval("if(globalSketch.keyReleased != null) globalSketch.keyReleased(this.pAppletEvent)");
  }
  catch (Exception e) {
    e.printStackTrace();
  }
}

void keyTyped(KeyEvent event) {
  try {
    nashorn.eval("for(var prop in pApplet) {if(!this.isReservedFunction(prop)) {globalSketch[prop] = pApplet[prop]}}");

    nashorn.eval("var pAppletEvent = {};");
    Object pAppletEvent = nashorn.eval("this.pAppletEvent");
    Object jsObject = nashorn.eval("Object");
    ((Invocable)nashorn).invokeMethod(jsObject, "bindProperties", pAppletEvent, event);

    nashorn.eval("if(globalSketch.keyTyped != null) globalSketch.keyTyped(this.pAppletEvent)");
  }
  catch (Exception e) {
    e.printStackTrace();
  }
}

void mouseClicked(MouseEvent event) {
  try {
    nashorn.eval("for(var prop in pApplet) {if(!this.isReservedFunction(prop)) {globalSketch[prop] = pApplet[prop]}}");

    nashorn.eval("var pAppletEvent = {};");
    Object pAppletEvent = nashorn.eval("this.pAppletEvent");
    Object jsObject = nashorn.eval("Object");
    ((Invocable)nashorn).invokeMethod(jsObject, "bindProperties", pAppletEvent, event);

    nashorn.eval("if(globalSketch.mouseClicked != null) globalSketch.mouseClicked(this.pAppletEvent)");
  }
  catch (Exception e) {
    e.printStackTrace();
  }
}

void mouseDragged(MouseEvent event) {
  try {
    nashorn.eval("for(var prop in pApplet) {if(!this.isReservedFunction(prop)) {globalSketch[prop] = pApplet[prop]}}");

    nashorn.eval("var pAppletEvent = {};");
    Object pAppletEvent = nashorn.eval("this.pAppletEvent");
    Object jsObject = nashorn.eval("Object");
    ((Invocable)nashorn).invokeMethod(jsObject, "bindProperties", pAppletEvent, event);

    nashorn.eval("if(globalSketch.mouseDragged != null) globalSketch.mouseDragged(this.pAppletEvent)");
  }
  catch (Exception e) {
    e.printStackTrace();
  }
}

void mouseMoved(MouseEvent event) {
  try {
    nashorn.eval("for(var prop in pApplet) {if(!this.isReservedFunction(prop)) {globalSketch[prop] = pApplet[prop]}}");

    nashorn.eval("var pAppletEvent = {};");
    Object pAppletEvent = nashorn.eval("this.pAppletEvent");
    Object jsObject = nashorn.eval("Object");
    ((Invocable)nashorn).invokeMethod(jsObject, "bindProperties", pAppletEvent, event);

    nashorn.eval("if(globalSketch.mouseMoved != null) globalSketch.mouseMoved(this.pAppletEvent)");
  }
  catch (Exception e) {
    e.printStackTrace();
  }
}

void mouseReleased(MouseEvent event) {
  try {
    nashorn.eval("for(var prop in pApplet) {if(!this.isReservedFunction(prop)) {globalSketch[prop] = pApplet[prop]}}");

    nashorn.eval("var pAppletEvent = {};");
    Object pAppletEvent = nashorn.eval("this.pAppletEvent");
    Object jsObject = nashorn.eval("Object");
    ((Invocable)nashorn).invokeMethod(jsObject, "bindProperties", pAppletEvent, event);

    nashorn.eval("if(globalSketch.mouseReleased != null) globalSketch.mouseReleased(this.pAppletEvent)");
  }
  catch (Exception e) {
    e.printStackTrace();
  }
}

void mouseWheel(MouseEvent event) {
  try {
    nashorn.eval("for(var prop in pApplet) {if(!this.isReservedFunction(prop)) {globalSketch[prop] = pApplet[prop]}}");

    nashorn.eval("var pAppletEvent = {};");
    Object pAppletEvent = nashorn.eval("this.pAppletEvent");
    Object jsObject = nashorn.eval("Object");
    ((Invocable)nashorn).invokeMethod(jsObject, "bindProperties", pAppletEvent, event);

    nashorn.eval("if(globalSketch.mouseWheel != null) globalSketch.mouseWheel(this.pAppletEvent)");
  }
  catch (Exception e) {
    e.printStackTrace();
  }
}

void mousePressed(MouseEvent event) {
  try {
    nashorn.eval("for(var prop in pApplet) {if(!this.isReservedFunction(prop)) {globalSketch[prop] = pApplet[prop]}}");

    nashorn.eval("var pAppletEvent = {};");
    Object pAppletEvent = nashorn.eval("this.pAppletEvent");
    Object jsObject = nashorn.eval("Object");
    ((Invocable)nashorn).invokeMethod(jsObject, "bindProperties", pAppletEvent, event);

    nashorn.eval("if(globalSketch.mousePressed != null) globalSketch.mousePressed(this.pAppletEvent)");
  }
  catch (Exception e) {
    e.printStackTrace();
  }
}

void oscEvent(OscMessage theOscMessage) {
  if (theOscMessage.checkAddrPattern("/openpose/poses")==true) {
    if (theOscMessage.checkTypetag("s")) {
      jsonString = theOscMessage.get(0).stringValue();
      return;
    }
  }
}

void webSocketServerEvent(String msg){
  //println(msg);
  jsonUiString = msg;
}
