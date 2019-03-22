
cc.Class({
    extends: cc.Component,

    properties: {
       pic:cc.Sprite,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {},

    setPicture:function(index, callback){
        let self = this;
        if(index === 0){
            //消除前的抖动动画
            let action1 = cc.rotateTo(0.05,10);
            let action2 = cc.rotateTo(0.05,0);
            let action3 = cc.rotateTo(0.05,-10);
            let finish = cc.callFunc(()=>{
                this.pic.spriteFrame = null;
                this.node.active = false;
                this.node.scale = 1.0;
                this.node.rotation = 0;
                if (callback){
                    callback();
                }
            });
            let sequence = cc.sequence(action1,action2,action3,finish);
            this.node.runAction(sequence);
            return;
        }
        this.node.active = true;
        if(cc.allPics){
            for(let i=0;i<cc.allPics.length;++i){
                if(cc.allPics[i].name === ''+index){
                    this.pic.spriteFrame = cc.allPics[i];
                    return;
                }
            }
            cc.loader.loadRes('animals/'+index,cc.SpriteFrame,function(err,spriteFrame){
                if(!err){
                    self.pic.spriteFrame = spriteFrame;
                }
            });
        }else{
            cc.loader.loadRes('animals/'+index,cc.SpriteFrame,function(err,spriteFrame){
                if(!err){
                    self.pic.spriteFrame = spriteFrame;
                }
            });
        }
    },

    // start () {},

    // update (dt) {},
});
