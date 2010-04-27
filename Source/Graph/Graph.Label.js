/*
   Object: Graph.Label

   Generic interface for plotting labels.

   Description:

   This is a generic interface for plotting/hiding/showing labels.
   The <Graph.Label> interface is implemented in multiple ways to provide
   different label types.

   For example, the Graph.Label interface is implemented as Graph.Label.DOM to provide
   DOM label elements. Also we provide the Graph.Label.SVG interface (currently not working in IE)
   for providing SVG type labels. The Graph.Label.Native interface implements these methods with the
   native Canvas text rendering functions (currently not working in Opera).

   Implemented by:

   <Hypertree.Label>, <RGraph.Label>, <ST.Label>.

   Access:

   The subclasses for this abstract class can be accessed by using the _labels_ property of the <Hypertree>, <RGraph>, or <ST> instances created.

   See also:

   <Hypertree.Plot>, <RGraph.Plot>, <ST.Plot>, <Hypertree>, <RGraph>, <ST>, <Graph>.

*/

Graph.Label = {};

/*
   Class: Graph.Label.Native

   Implements labels natively, using the Canvas text API.

   See also:

   <Hypertree.Label>, <RGraph.Label>, <ST.Label>, <Hypertree>, <RGraph>, <ST>, <Graph>.

*/
Graph.Label.Native = new Class({
     /*
       Method: plotLabel

       Plots a label for a given node.

       Parameters:

       canvas - A <Canvas> instance.
       node - A <Graph.Node>.
       controller - A configuration object. See also <Hypertree>, <RGraph>, <ST>.

    */
    plotLabel: function(canvas, node, controller) {
      var ctx = canvas.getCtx();
      var coord = node.pos.getc(true);
      ctx.fillText(node.name, coord.x, coord.y);
    },

    hideLabel: $.empty,
    hideLabels: $.empty
});

/*
   Class: Graph.Label.DOM

   Abstract Class implementing some DOM label methods.

   Implemented by:

   <Graph.Label.HTML>, <Graph.Label.SVG>.

   See also:

   <Hypertree.Label>, <RGraph.Label>, <ST.Label>, <Hypertree>, <RGraph>, <ST>, <Graph>.

*/
Graph.Label.DOM = new Class({
    //A flag value indicating if node labels are being displayed or not.
    labelsHidden: false,
    //Label container
    labelContainer: false,
    //Label elements hash.
    labels: {},

    /*
       Method: getLabelContainer

       Lazy fetcher for the label container.

       Returns:

       The label container DOM element.

       Example:

      (start code js)
        var rg = new RGraph(canvas, config); //can be also Hypertree or ST
        var labelContainer = rg.fx.getLabelContainer();
        alert(labelContainer.innerHTML);
      (end code)
    */
    getLabelContainer: function() {
      return this.labelContainer ?
        this.labelContainer :
        this.labelContainer = document.getElementById(this.viz.config.labelContainer);
    },

    /*
       Method: getLabel

       Lazy fetcher for the label element.

       Parameters:

       id - The label id (which is also a <Graph.Node> id).

       Returns:

       The label element.

       Example:

      (start code js)
        var rg = new RGraph(canvas, config); //can be also Hypertree or ST
        var label = rg.fx.getLabel('someid');
        alert(label.innerHTML);
      (end code)

    */
    getLabel: function(id) {
      return (id in this.labels && this.labels[id] != null) ?
        this.labels[id] :
        this.labels[id] = document.getElementById(id);
    },

    /*
       Method: hideLabels

       Hides all labels (by hiding the label container).

       Parameters:

       hide - A boolean value indicating if the label container must be hidden or not.

       Example:
       (start code js)
        var rg = new RGraph(canvas, config); //can be also Hypertree or ST
        rg.fx.hideLabels(true);
       (end code)

    */
    hideLabels: function (hide) {
      var container = this.getLabelContainer();
      if(hide)
        container.style.display = 'none';
      else
        container.style.display = '';
      this.labelsHidden = hide;
    },

    /*
       Method: clearLabels

       Clears the label container.

       Useful when using a new visualization with the same canvas element/widget.

       Parameters:

       force - Forces deletion of all labels.

       Example:
       (start code js)
        var rg = new RGraph(canvas, config); //can be also Hypertree or ST
        rg.fx.clearLabels();
        (end code)
    */
    clearLabels: function(force) {
      for(var id in this.labels) {
        if (force || !this.viz.graph.hasNode(id)) {
          this.disposeLabel(id);
          delete this.labels[id];
        }
      }
    },

    /*
       Method: disposeLabel

       Removes a label.

       Parameters:

       id - A label id (which generally is also a <Graph.Node> id).

       Example:
       (start code js)
        var rg = new RGraph(canvas, config); //can be also Hypertree or ST
        rg.fx.disposeLabel('labelid');
       (end code)
    */
    disposeLabel: function(id) {
      var elem = this.getLabel(id);
      if(elem && elem.parentNode) {
        elem.parentNode.removeChild(elem);
      }
    },

    /*
       Method: hideLabel

       Hides the corresponding <Graph.Node> label.

       Parameters:

       node - A <Graph.Node>. Can also be an array of <Graph.Nodes>.
       show - If *true*, nodes will be shown. Otherwise nodes will be hidden.

       Example:
       (start code js)
        var rg = new RGraph(canvas, config); //can be also Hypertree or ST
        rg.fx.hideLabel(rg.graph.getNode('someid'), false);
       (end code)
    */
    hideLabel: function(node, show) {
      node = $.splat(node);
      var st = show ? "" : "none", lab, that = this;
      $.each(node, function(n) {
        var lab = that.getLabel(n.id);
        if (lab) {
          lab.style.display = st;
        }
      });
    },

    /*
      Method: attachExtras

      Called only when a label is created to attach <Extras> like <Tips> or <NodeStyles> to labels

      Parameters:

      node - A <Graph.Node>.
      tag - A DOM element.

   */
    attachExtras: function(node, tag) {
      var viz = this.viz, config = viz.config;
      var tips = config.Tips, nodeStyles = config.NodeStyles;
      if(tips && tips.enable && tips.attachToDOM) {
        viz.tips.attach(node, tag);
      }
      if(nodeStyles && nodeStyles.attachToDOM) {
        if(nodeStyles.stylesHover) {
          viz.nodeStyles.attachOnHover(node, tag);
        }
        if(nodeStyles.stylesClick) {
          viz.nodeStyles.attachOnClick(node, tag);
        }
      }
    },

    /*
       Method: fitsInCanvas

       Returns _true_ or _false_ if the label for the node is contained in the canvas dom element or not.

       Parameters:

       pos - A <Complex> instance (I'm doing duck typing here so any object with _x_ and _y_ parameters will do).
       canvas - A <Canvas> instance.

       Returns:

       A boolean value specifying if the label is contained in the <Canvas> DOM element or not.

    */
    fitsInCanvas: function(pos, canvas) {
      var size = canvas.getSize();
      if(pos.x >= size.width || pos.x < 0
         || pos.y >= size.height || pos.y < 0) return false;
       return true;
    }
});

/*
   Class: Graph.Label.HTML

   Implements HTML labels.

   Extends:

   <Graph.Label.DOM>.

   See also:

   <Hypertree.Label>, <RGraph.Label>, <ST.Label>, <Hypertree>, <RGraph>, <ST>, <Graph>.

*/
Graph.Label.HTML = new Class({
    Implements: Graph.Label.DOM,

    /*
       Method: plotLabel

       Plots a label for a given node.

       Parameters:

       canvas - A <Canvas> instance.
       node - A <Graph.Node>.
       controller - A configuration object. See also <Hypertree>, <RGraph>, <ST>.

    */
    plotLabel: function(canvas, node, controller) {
      var id = node.id, tag = this.getLabel(id);

      if(!tag && !(tag = document.getElementById(id))) {
        tag = document.createElement('div');
        var container = this.getLabelContainer();
        tag.id = id;
        tag.className = 'node';
        tag.style.position = 'absolute';
        controller.onCreateLabel(tag, node);
        container.appendChild(tag);
        this.labels[node.id] = tag;
        this.attachExtras(node, tag);
      }

      this.placeLabel(tag, node, controller);
    }
});

/*
   Class: Graph.Label.SVG

   Implements SVG labels.

   Extends:

   <Graph.Label.DOM>.

   See also:

   <Hypertree.Label>, <RGraph.Label>, <ST.Label>, <Hypertree>, <RGraph>, <ST>, <Graph>.

*/
Graph.Label.SVG = new Class({
    Implements: Graph.Label.DOM,

    /*
       Method: plotLabel

       Plots a label for a given node.

       Parameters:

       canvas - A <Canvas> instance.
       node - A <Graph.Node>.
       controller - A configuration object. See also <Hypertree>, <RGraph>, <ST>.

    */
    plotLabel: function(canvas, node, controller) {
      var id = node.id, tag = this.getLabel(id);
      if(!tag && !(tag = document.getElementById(id))) {
        var ns = 'http://www.w3.org/2000/svg';
          tag = document.createElementNS(ns, 'svg:text');
        var tspan = document.createElementNS(ns, 'svg:tspan');
        tag.appendChild(tspan);
        var container = this.getLabelContainer();
        tag.setAttribute('id', id);
        tag.setAttribute('class', 'node');
        container.appendChild(tag);
        controller.onCreateLabel(tag, node);
        this.labels[node.id] = tag;
        this.attachExtras(node, tag);
      }
      this.placeLabel(tag, node, controller);
    }
});

