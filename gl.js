import buildingShaderSrc from './building.vert.js';
import flatShaderSrc from './flat.vert.js';
import fragmentShaderSrc from './fragment.glsl.js';

var gl;

var layers = null

var modelMatrix;
var projectionMatrix;
var viewMatrix;

var currRotate = 0;
var currZoom = 0;
var currProj = 'perspective';

/*
    Vertex shader with normals
*/
class BuildingProgram {
    constructor() {
        this.vertexShader = createShader(gl, gl.VERTEX_SHADER, buildingShaderSrc);
        this.fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
        this.program = createProgram(gl, this.vertexShader, this.fragmentShader);

        //! TODO: set attrib and uniform locations
        this.postAttribLoc = gl.getAttribLocation(this.program, "position");
        this.uniformLoc = gl.getUniformLoation(this.program, 'uColor');
    }

    use() {
        gl.useProgram(this.program);
    }
}

/*
    Vertex shader with uniform colors
*/
class FlatProgram {
    constructor() {
        this.vertexShader = createShader(gl, gl.VERTEX_SHADER, flatShaderSrc);
        this.fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
        this.program = createProgram(gl, this.vertexShader, this.fragmentShader);

        //! TODO: set attrib and uniform locations, position, normal, color
        this.postAttribLoc = gl.getAttribLocation(this.program, "position");
        this.uniformLoc = gl.getUniformLoation(this.program, 'uColor');

        gl.uniformMatrix4fc(this.program.modelLoc, false, new Float32Array(modelMatrix));
        gl.uniform4fc(this.program.colorAttribLoc, this.color);
    }

    use() {
        gl.useProgram(this.program);
    }
}


/*
    Collection of layers
*/
class Layers {
    constructor() {
        this.layers = {};
        this.centroid = [0,0,0];
    }

    addBuildingLayer(name, vertices, indices, normals, color){
        var layer = new BuildingLayer(vertices, indices, normals, color);
        layer.init();
        this.layers[name] = layer;
        this.centroid = this.getCentroid();
    }

    addLayer(name, vertices, indices, color) {
        var layer = new Layer(vertices, indices, color);
        layer.init();
        this.layers[name] = layer;
        this.centroid = this.getCentroid();
    }

    removeLayer(name) {
        delete this.layers[name];
    }

    draw() {
        for(var layer in this.layers) {
            this.layers[layer].draw(this.centroid);
        }
    }

    
    getCentroid() {
        var sum = [0,0,0];
        var numpts = 0;
        for(var layer in this.layers) {
            numpts += this.layers[layer].vertices.length/3;
            for(var i=0; i<this.layers[layer].vertices.length; i+=3) {
                var x = this.layers[layer].vertices[i];
                var y = this.layers[layer].vertices[i+1];
                var z = this.layers[layer].vertices[i+2];
    
                sum[0]+=x;
                sum[1]+=y;
                sum[2]+=z;
            }
        }
        return [sum[0]/numpts,sum[1]/numpts,sum[2]/numpts];
    }
}

/*
    Layers without normals (water, parks, surface)
*/
class Layer {
    constructor(vertices, indices, color) {
        this.vertices = vertices;
        this.indices = indices;
        this.color = color;
    }

    init() {
        // TODO: create program, set vertex and index buffers, vao
        this.program = new FlatProgram();
        this.vertexBuffer = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.vertices));
        this.vao = createVAO(gl, this.program.postAttribLoc, this.vertexBuffer);
    }

    draw(centroid) {
        // TODO: use program, update model matrix, view matrix, projection matrix
        // TODO: set uniforms
        // TODO: bind vao, bind index buffer, draw elements

        // use program
        this.program.use();

        // update model matrix
        updateModelMatrix(centroid);
        gl.uniformMatrix4fc(this.program.modelLoc, false, new Float32Array(modelMatrix));

        // projection matrx
        updateProjectionMatrix();
        gl.uniformMatrix4fc(this.program.modelLoc, false, new Float32Array(modelMatrix));

        // view matrix
        updateViewMatrix(centroid);
        gl.uniformMatrix4fc(this.program.modelLoc, false, new Float32Array(modelMatrix));

        gl.uniform4fc(this.program.colorAttribLoc, this.color);

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT,0)

    }
}

/*
    Layer with normals (building)
*/
class BuildingLayer extends Layer {
    constructor(vertices, indices, normals, color) {
        super(vertices, indices, color);
        this.normals = normals;
    }

    init() {
        // TODO: create program, set vertex, normal and index buffers, vao
        this.program = gl.createProgram();
        this.vertexBuffer = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.vertices));
        this.vao = createVAO(gl, this.program.postAttribLoc, this.vertexBuffer);
        
    }

    draw(centroid) {
        // TODO: use program, update model matrix, view matrix, projection matrix
        // TODO: set uniforms
        // TODO: bind vao, bind index buffer, draw elements
        // use program
        this.program.use();

        // update model matrix
        updateModelMatrix(centroid);
        gl.uniformMatrix4fc(this.program.modelLoc, false, new Float32Array(modelMatrix));

        // projection matrx
        updateProjectionMatrix();
        gl.uniformMatrix4fc(this.program.modelLoc, false, new Float32Array(modelMatrix));

        // view matrix
        updateViewMatrix(centroid);
        gl.uniformMatrix4fc(this.program.modelLoc, false, new Float32Array(modelMatrix));

        gl.uniform4fc(this.program.colorAttribLoc, this.color);

        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT,0)

    }
}

/*
    Event handlers
*/
window.updateRotate = function() {
    currRotate = parseInt(document.querySelector("#rotate").value);
}

window.updateZoom = function() {
    currZoom = parseFloat(document.querySelector("#zoom").value);
}

window.updateProjection = function() {
    currProj = document.querySelector("#projection").value;
}

/*
    File handler

    addBuildingLayer(name, vertices, indices, normals, color)
    {
        var layer = new BuildingLayer(vertices, indices, normals, color);
        layer.init();
        this.layers[name] = layer;
        this.centroid = this.getCentroid();
    }

    addLayer(name, vertices, indices, color) 
    {
        var layer = new Layer(vertices, indices, color);
        layer.init();
        this.layers[name] = layer;
        this.centroid = this.getCentroid();
    }
*/
window.handleFile = function(e) {
    var reader = new FileReader();
    reader.onload = function(evt) {
        //! TODO: parse JSON
        const parsed = JSON.parse(reader.result);
        for(var layer in parsed){
            switch (layer) {
                //! TODO: add to layer with appropriate parameters
                case 'buildings':
                    // TODO
                    layers.addBuildingLayer(layer.name, layer.vertices, layer.indices, layer.normals, layer.color);
                    // layers.addBuildingLayer(parsed.name, parsed.vertices, parsed.indices, parsed.normals, parsed.color);
                    break;
                case 'water':
                    // TODO
                    layers.addLayer(layer.name, layer.vertices, layer.indices, layer.color);
                    break;
                case 'parks':
                    // TODO
                    layers.addLayer(layer.name, layer.vertices, layer.indices, layer.color);
                    break;
                case 'surface':
                    // TODO
                    layers.addLayer(layer.name, layer.vertices, layer.indices, layer.color);
                    break;
                default:
                    break;
            }
        }
    }
    reader.readAsText(e.files[0]);
}

/*
    Update transformation matrices
*/
function updateModelMatrix(centroid) { //! CENTROID PARAMETER NOT USED
    // TODO: update model matrix
    var scale = scaleMatrix(0.5, 0.5, 0.5);
    var rotateX = rotateXMatrix(45.0 * Math.PI / 180.0);
    var rotateY = rotateYMatrix(-45.0 * Math.PI / 180.0);
    var translation = translateMatrix(0, 0, -50);

    modelMatrix = identityMatrix();
    // modelMatrix = multiplyArrayOfMatrices([
    //     translation,
    //     rotateX,
    //     rotateY,
    //     scale
    // ]);

}

function updateProjectionMatrix() {
    // TODO: update projection matrix
    var aspect = window.innerWidth /  window.innerHeight;
    projectionMatrix = perspectiveMatrix(45 * Math.PI / 180.0, aspect, 0, 500);
    // projectionMatrix = orthographicMatrix(-aspect, aspect, -1, 1, -1, 500); //! <-----ORTOGRAPHIC
}

//! TAKE INTO ACCOUNT ROTATION
function updateViewMatrix(centroid){
    // TODO: update view matrix
    // TIP: use lookat function

    //! 3 parameters -> function lookAt(eye, center, up) 
    //the view matrix should just be the result of lookat with 
    // eye being the centroid + some z offset, 
    //the center should be the centroid, 
    // and the UP vector should be some vector perpendicular to the z and left vector right
    // Regarding the UP vector, note that [0,1,0] would work in this case.
    //! Verify parameter arguments
    viewMatrix = lookAt(centroid + z, centroid, [0,1,0]);
    //-----------
    // var now = Date.now();
    // var moveInAndOut = 5 - 50.0*(Math.sin(now * 0.002) + 1.0)/2.0;

    // var position = translateMatrix(0, 0, moveInAndOut);
    // viewMatrix = invertMatrix(position);
}

/*
    Main draw function (should call layers.draw)
*/
function draw() {

    gl.clearColor(190/255, 210/255, 215/255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    layers.draw();

    requestAnimationFrame(draw);

}

/*
    Initialize everything
*/
function initialize() {

    var canvas = document.querySelector("#glcanvas");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    gl = canvas.getContext("webgl2");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    layers = new Layers();

    window.requestAnimationFrame(draw);

}


window.onload = initialize;