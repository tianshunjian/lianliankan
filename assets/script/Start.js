
cc.Class({
    extends: cc.Component,

    properties: {
        startBtn:cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        cc.loader.loadResDir('animals', cc.SpriteFrame, function (err, assets) {
            if(!err){
                cc.allPics = assets;
            }
        });
        this.startBtn.on('click',this.startBtnClicked,this);
    },

    startBtnClicked:function(){
        cc.director.loadScene('Game');
    },

    // start () {},

    // update (dt) {},
});
