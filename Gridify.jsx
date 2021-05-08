var panelGlobal = this;
var palette = (function () {

    var scaleExpression = '\
var indexOffset = parent.index;\
var height = sourceRectAtTime().height;\
var width = sourceRectAtTime().width;\
var layerAmount = parent.effect("Columns")("Slider");\
var margin = parent.effect("Margin")("Slider");\
var rowToScale = parent.effect("Row to Scale")("Slider") - 1;\
var rowScale = (parent.effect("Row Scale")("Slider")+100)/100;\
var columns = (index-indexOffset) % layerAmount;\
var rows = Math.floor((index-1-indexOffset) / layerAmount);\
var startLayer = (rows * layerAmount) + 1 + indexOffset;\
var endLayer = ((rows+1) * layerAmount) + indexOffset;\
var widthOfAll = 0;\
var minHeight = 1000000;\
var newScale = 100;\
for(var i = startLayer; i <= endLayer; i++){\
	if (i > thisComp.numLayers) break;\
	minHeight = Math.min(minHeight, thisComp.layer(i).sourceRectAtTime().height);\
}\
if (minHeight < height){\
	newScale = minHeight / height * 100;\
}\
for(var i = startLayer; i <= endLayer; i++){\
	if (i > thisComp.numLayers)break;\
	widthOfAll += thisComp.layer(i).sourceRectAtTime().width * (minHeight / thisComp.layer(i).sourceRectAtTime().height);\
}\
newScale = ((thisComp.width-margin) / widthOfAll) * 100 * (newScale/100);\
newScale = (rows == rowToScale) ? newScale * rowScale : newScale;\
[newScale, newScale]\
'
    var positionExpression = '\
var width = sourceRectAtTime().width;\
var height = sourceRectAtTime().height;\
var scale = transform.scale[0];\
var indexOffset = parent.index;\
var layerAmount = parent.effect("Columns")("Slider");\
var margin = parent.effect("Margin")("Slider") / (layerAmount+1);\
var oddRowPos = parent.effect("Odd Row Pos")("Slider");\
var evenRowPos = parent.effect("Even Row Pos")("Slider");\
var columnLeft = (index == 1 + indexOffset) ? null : thisComp.layer(index - 1);\
var rowUp = index - layerAmount;\
var columns = (index-1-indexOffset) % layerAmount;\
var rows = Math.floor((index-1-indexOffset) / layerAmount);\
var x = (columns == 0) ? (width * (scale/100)) / 2 + margin: columnLeft.position[0] + ((columnLeft.sourceRectAtTime().width * (columnLeft.scale[0]/100)) / 2) + (width * (scale/100)) / 2 + margin;\
if(rows == 0){\
	var y =  (((height * (scale / 100)) * rows) + (height * (scale / 100)) / 2) + margin;\
}else{\
	var rowUpHeight = thisComp.layer(rowUp).sourceRectAtTime().height;\
	var rowUpScale = thisComp.layer(rowUp).scale[0];\
	var rowUpPos = thisComp.layer(rowUp).position[1];\
	var y = (rowUpPos + ((rowUpHeight * (rowUpScale / 100))/2) + (height * (scale / 100)) / 2) + margin;\
}\
if (columns == 0){\
	if ((rows+1) % 2 != 0){\
		x += oddRowPos;\
	}else{\
		x += evenRowPos;\
	}\
}\
'
    if (app.project.expressionEngine == 'extendscript') {
        positionExpression += '[x[0],y[1]];';
    } else {
        positionExpression += '[x,y];';
    }



    var palette = (panelGlobal instanceof Panel) ? panelGlobal : new Window("palette", undefined, undefined, { resizeable: true });
    if (!(panelGlobal instanceof Panel)) palette.text = "Gridify";
    palette.orientation = "column";
    palette.spacing = 10;
    palette.margins = 16;

    var button = palette.add("button", undefined, undefined, { name: "button" });
    button.text = "Gridify";
    button.onClick = function () { main(); };

    palette.layout.layout(true);
    palette.layout.resize();
    palette.onResizing = palette.onResize = function () { this.layout.resize(); }

    if (palette instanceof Window) palette.show();

    function main() {

        app.beginUndoGroup("Gridify")

        var comp = app.project.activeItem;
        var layers = [];

        if (comp.selectedLayers.length == 0) {

            for (var i = 1; i <= comp.numLayers; i++) {
                layers.push(comp.layers[i]);
            }
        } else layers = comp.selectedLayers;

        var gridController = comp.layers.addNull();
        gridController.source.name = "Grid Controller"
        gridController.name = "Grid Controller"
        gridController.property("position").setValue([0, 0]);
        gridController.enabled = false;

        var gridControllerProperties = [["Columns", 10], ["Margin", 0], ["Odd Row Pos", 0], ["Even Row Pos", 0], ["Row to Scale", 0], ["Row Scale", 0]];

        for (var i = 0; i < gridControllerProperties.length; i++) {

            var slider = gridController.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
            slider.name = gridControllerProperties[i][0];
            slider.property(1).setValue(gridControllerProperties[i][1]);

        }

        for (var i = 0; i < layers.length; i++) {

            if (i == 0) {
                layers[i].moveAfter(gridController);
            } else layers[i].moveAfter(layers[i - 1]);

            layers[i].property("scale").expression = scaleExpression;
            layers[i].property("position").expression = positionExpression;
            layers[i].parent = gridController;
        }

        app.endUndoGroup();

    }

}());