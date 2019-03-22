
cc.Class({
    extends: cc.Component,

    properties: {
        div:cc.Node,
        pairsLabel:cc.Label,
        overNode:cc.Node,
        titleLabel:cc.Label,
        restartBtn:cc.Node,
        backBtn:cc.Node,
        graphicsNode:cc.Node,
        picPrefab:cc.Prefab,

        //音效
        clickAudio:cc.AudioClip,
        destroyAudio:cc.AudioClip,
        wrongAudio:cc.AudioClip,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.restartBtn.on('click',this.restartBtnClicked,this);
        this.backBtn.on('click',this.backBtnClicked,this);
        this.overNode.on(cc.Node.EventType.TOUCH_START,function () {
            return true;
        },this);
        //变量初始化
        this.initProperty();
        //初始化棋盘
        this.reset();
    },

    //再来一局
    restartBtnClicked:function(){
        this.reset();
        this.overNode.active = false;
    },

    //返回
    backBtnClicked:function(){
        cc.director.loadScene('Start');
    },

    //变量初始化
    initProperty:function(){
        this.column = 8;
        this.row = 10;
        this.picTypeNum = 10;//图片种类数
        this.pairs = parseInt(this.column*this.row/2);//成对数

        //小图片的宽
        this.nodeWidth = (this.div.width-10*(this.column+1))/this.column;
        this.div.height = this.nodeWidth*this.row + 10*(this.row+1);

        //记录点击的前一个节点
        this.preTouchNode = null;

        //节点数组 (row * column)
        this.nodeArray = new Array();
        for(let i=0;i<this.row;++i){
            this.nodeArray[i] = new Array();
            for(let j=0;j<this.column;++j){
                let node = cc.instantiate(this.picPrefab);
                node.position = this.getPosition(i,j);
                node.width = this.nodeWidth;
                node.height = node.width;
                node.tag = i*this.column + j;
                this.div.addChild(node);
                node.on(cc.Node.EventType.TOUCH_END,this.nodeTouched,this);

                let picPrefab = node.getComponent('PicPrefab');
                this.nodeArray[i][j] = picPrefab;
            }
        }

        //绘图节点
        this.graphicsNode.height = this.div.height;
        this.graphicsNode.width = this.div.width;

        // (row+2)*(column+2)数组，用于逻辑运算
        this.board = new Array();
        for(let i=0;i<this.row+2;++i){
            this.board[i] = new Array();
            for(let j=0;j<this.column+2;++j){
                this.board[i][j] = 0;
            }
        }
        //选出的图片数组
        this.imgArray = [];
    },

    //重置棋盘
    reset:function(){
        //成对数
        this.pairs = parseInt(this.column*this.row/2);
        this.pairsLabel.string = '剩余 '+this.pairs+' 对';
        //随机选出 this.picTypeNum 种图片
        this.randomPics();
        //重置 this.board
        this.resetBoard();
        //打乱 this.board
        this.disorderBoard();
        //更新显示图片
        this.updatePicsBoard();
    },

    //更新显示图片
    updatePicsBoard:function(){
        for(let i=0;i<this.row;++i){
            for(let j=0;j<this.column;++j){
                let prefab = this.nodeArray[i][j];
                prefab.setPicture(this.board[i+1][j+1]);
            }
        }
    },

    //图片命名：1~20，从20种图片选出所需图片
    //随机选出 this.picTypeNum 种图片
    randomPics:function(){
        this.imgArray = [];
        for(let i=0;i<this.picTypeNum;++i){
            let num = -1;
            while(num === -1 || this.imgArray.indexOf(num) !== -1){
                num = parseInt(Math.random()*100%20+1);
            }
            this.imgArray.push(num);
        }
    },

    //重置 this.board
    resetBoard:function(){
        let k=0;
        for(let i=0;i<this.row+2;++i){
           let j=0;
           while(j<this.column+2){
               if(j===0 || j===this.column+1 || i===0 || i===this.row+1){
                   this.board[i][j] = 0;
                   ++j;
               }else{
                   this.board[i][j] = this.imgArray[k];
                   ++j;
                   this.board[i][j] = this.imgArray[k];
                   ++j;
                   ++k;
                   if(k === this.imgArray.length){
                       k=0;
                   }
               }
           }
        }
    },

    //打乱 this.board
    disorderBoard:function(){
        let height = this.row;
        let width = this.column;
        for(let i=1;i<=height;++i){
            for(let j=1;j<=width;++j){
                let x = parseInt(Math.random()*100%height + 1);
                let y = parseInt(Math.random()*100%width + 1);
                let tmp = this.board[i][j];
                this.board[i][j] = this.board[x][y];
                this.board[x][y] = tmp;
            }
        }
    },

    //图片的位置
    getPosition:function(i,j){
        let w = this.nodeWidth;
        return cc.p(10*(j+1)+w*j+w/2,-(10*(i+1)+w*i+w/2));
    },

    //点击处理
    nodeTouched:function(event){
        this.isNeedDraw = true; //死局检测时，不需要画线
        let curNode = event.target;
        if(!this.preTouchNode){
            //第一次点击
            cc.audioEngine.play(this.clickAudio,false,1);
            this.preTouchNode = curNode;
            curNode.scale = 1.2;
        }else{
            //第二次点击，开始处理
            if(curNode.tag === this.preTouchNode.tag){
                cc.audioEngine.play(this.wrongAudio,false,1);
            }else{
                let i = parseInt(curNode.tag/this.column);
                let j = curNode.tag % this.column;
                let preI = parseInt(this.preTouchNode.tag/this.column);
                let preJ = this.preTouchNode.tag % this.column;
                let row1=preI+1, col1= preJ+1, row2=i+1,col2=j+1;
                if(this.board[row1][col1] === this.board[row2][col2]){
                    if(this.canCleanUp(row1,col1,row2,col2)){
                        //可以消除
                        cc.audioEngine.play(this.destroyAudio,false,1);
                        this.pairs--;
                        this.pairsLabel.string = '剩余 '+this.pairs+' 对';
                        this.board[row1][col1] = 0;
                        this.board[row2][col2] = 0;
                        this.preTouchNode = null;

                        this.nodeArray[preI][preJ].setPicture(0);
                        this.nodeArray[i][j].setPicture(0,()=>{
                            if(this.pairs === 0){
                                //胜利
                                this.titleLabel.string = '胜利';
                                this.overNode.active = true;
                            }else{
                                if(this.isDead()){
                                    this.titleLabel.string = '已成死局！还剩 '+this.pairs+' 对';
                                    this.overNode.active = true;
                                }
                            }
                        });
                    } else{
                        //不可以消除
                        cc.audioEngine.play(this.wrongAudio,false,1);
                        this.preTouchNode.scale = 1.0;
                        curNode.scale = 1.2;
                        this.preTouchNode = curNode; 
                    }
                } else{
                    //不可以消除
                    cc.audioEngine.play(this.wrongAudio,false,1);
                    this.preTouchNode.scale = 1.0;
                    curNode.scale = 1.2;
                    this.preTouchNode = curNode; 
                }
            }
        }
    },

    //画线用
    drawLine:function(posArr){
        if (!this.isNeedDraw) {
            //死局检测时，不需要画线
            return;
        }
        let positionArr = [];
        for (let i=0;i<posArr.length;++i){
            let tmp = posArr[i];
            let pos = this.getPosition(tmp[0]-1,tmp[1]-1);
            positionArr.push(pos);
        }
        let pos0 = positionArr[0];
        let pos1 = positionArr[1];
        if (pos0.x > pos1.x){
            pos0.x -= this.nodeWidth/2;
        } else if (pos0.x < pos1.x){
            pos0.x += this.nodeWidth/2;
        }
        if (pos0.y > pos1.y){
            pos0.y -= this.nodeWidth/2;
        } else if (pos0.y < pos1.y){
            pos0.y += this.nodeWidth/2;
        }
        let posN1 = positionArr[positionArr.length-2];
        let posN = positionArr[positionArr.length-1];
        if (posN.x > posN1.x){
            posN.x -= this.nodeWidth/2;
        } else if (posN.x < posN1.x){
            posN.x += this.nodeWidth/2;
        }
        if (posN.y > posN1.y){
            posN.y -= this.nodeWidth/2;
        } else if (posN.y < posN1.y){
            posN.y += this.nodeWidth/2;
        }
        let ctx = this.graphicsNode.getComponent(cc.Graphics);
        ctx.moveTo(positionArr[0].x, this.div.height+positionArr[0].y);
        for (let i=1;i<positionArr.length;++i){
            ctx.lineTo(positionArr[i].x, this.div.height+positionArr[i].y);
        }
        ctx.stroke();
        this.scheduleOnce(()=>{
            ctx.clear(true);
        },0.2);
    },

    //死局检测
    isDead:function(){
        this.isNeedDraw = false; //死局检测时，不需要画线
        for(let i=0;i<this.row+2;++i){
            for(let j=0;j<this.column+2;++j){
                for(let m=0;m<this.row+2;++m){
                    for(let n=0;n<this.column+2;++n){
                        if(this.canCleanUp(i,j,m,n)){
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    },

    //行是否为空
    isRowEmpty:function(row1,column1,row2,column2){
        if(row1 !== row2){
            return false;
        }
        if(column1 > column2){
            let tmp = column1;
            column1 = column2;
            column2 = tmp;
        }
        for(let j=column1+1;j<column2;++j){
            if(this.board[row1][j] > 0){
                return false;
            }
        }
        return true;
    },

    //列是否为空
    isColumnEmpty:function(row1,column1,row2,column2){
        if(column1 !== column2){
            return false;
        }
        if(row1 > row2){
            let tmp = row1;
            row1 = row2;
            row2 = tmp;
        }
        for(let i=row1+1;i<row2;++i){
            if(this.board[i][column1] > 0){
                return false;
            }
        }
        return true;
    },

    // (row1,column1) 和 (row2,column2) 是否可消除
    canCleanUp:function(row1,column1,row2,column2){
        if(row1===row2 && column1 === column2){
            return false;
        }
        if(this.board[row1][column1] !== this.board[row2][column2]){
            return false;
        }
        if(this.board[row1][column1]===0 || this.board[row2][column2]===0){
            return false;
        }
        //同列
        if(column1 === column2){
            if(this.isColumnEmpty(row1,column1,row2,column2)){
                //直线,可消除，需要画线
                if (Math.abs(row1-row2)>1){
                    let posArr = [[row1,column1],[row2,column2]];
                    this.drawLine(posArr);
                }
                return true;
            }
            //两个拐点
            let i=1;
            while(column1+i<this.column+2 && this.board[row1][column1+i]===0){
                if(this.board[row2][column2+i] > 0){
                    break;
                }
                if(this.isColumnEmpty(row1,column1+i,row2,column2+i)){
                    //拐点找到,可消除，需要画线
                    let posArr = [[row1,column1],[row1,column1+i],[row2,column2+i],[row2,column2]];
                    this.drawLine(posArr);
                    return true;
                }
                ++i;
            }
            i = 1;
            while(column1-i>=0 && this.board[row1][column1-i]===0){
                if(this.board[row2][column2-i] > 0){
                    break;
                }
                if(this.isColumnEmpty(row1,column1-i,row2,column2-i)){
                    //拐点找到,可消除，需要画线
                    let posArr = [[row1,column1],[row1,column1-i],[row2,column2-i],[row2,column2]];
                    this.drawLine(posArr);
                    return true;
                }
                ++i;
            }
        }
        //同行
        if(row1 === row2){
            if(this.isRowEmpty(row1,column1,row2,column2)){
                //直线,可消除，需要画线
                if (Math.abs(column1-column2)>1){
                    let posArr = [[row1,column1],[row2,column2]];
                    this.drawLine(posArr);
                }
                return true;
            }
            let i = 1;
            while(row1+i<this.row+2 && this.board[row1+i][column1]===0){
                if(this.board[row2+i][column2] > 0){
                    break;
                }
                if(this.isRowEmpty(row1+i,column1,row2+i,column2)){
                    //拐点找到,可消除，需要画线
                    let posArr = [[row1,column1],[row1+i,column1],[row2+i,column2],[row2,column2]];
                    this.drawLine(posArr);
                    return true;
                }
                ++i;
            }
            i = 1;
            while(row1-i>=0 && this.board[row1-i][column1]===0){
                if(this.board[row2-i][column2]>0){
                    break;
                }
                if(this.isRowEmpty(row1-i,column1,row2-i,column2)){
                    //拐点找到,可消除，需要画线
                    let posArr = [[row1,column1],[row1-i,column1],[row2-i,column2],[row2,column2]];
                    this.drawLine(posArr);
                    return true;
                }
                ++i;
            }
        }
        //不同列不同行
        if(row1!== row2 && column1!==column2){
            //一个拐点
            if(this.board[row1][column2]===0 && this.isRowEmpty(row1,column1,row1,column2)){
                if(this.isColumnEmpty(row1,column2,row2,column2)){
                    //拐点找到,可消除，需要画线
                    let posArr = [[row1,column1],[row1,column2],[row2,column2]];
                    this.drawLine(posArr);
                    return true;
                }
            }
            if(this.board[row2][column1]===0 && this.isColumnEmpty(row1,column1,row2,column1)){
                if(this.isRowEmpty(row2,column1,row2,column2)){
                    //拐点找到,可消除，需要画线
                    let posArr = [[row1,column1],[row2,column1],[row2,column2]];
                    this.drawLine(posArr);
                    return true;
                }
            }
            //在一列的两个拐点
            let i = column1;
            while(++i < this.column+2){
                if(this.board[row1][i]>0){
                    break;
                }
                if(this.board[row2][i]===0 && this.isColumnEmpty(row1,i,row2,i) && this.isRowEmpty(row2,i,row2,column2)){
                    //拐点找到,可消除，需要画线
                    let posArr = [[row1,column1],[row1,i],[row2,i],[row2,column2]];
                    this.drawLine(posArr);
                    return true;
                }
            }
            i = column1;
            while(--i >= 0){
                if(this.board[row1][i] > 0){
                    break;
                }
                if(this.board[row2][i]===0 && this.isColumnEmpty(row1,i,row2,i) && this.isRowEmpty(row2,i,row2,column2)){
                    //拐点找到,可消除，需要画线
                    let posArr = [[row1,column1],[row1,i],[row2,i],[row2,column2]];
                    this.drawLine(posArr);
                    return true;
                }
            }
            //在一行的两个拐点
            i = row1;
            while(++i<this.row+2){
                if(this.board[i][column1]>0){
                    break
                }
                if(this.board[i][column2]===0 && this.isRowEmpty(i,column1,i,column2) && this.isColumnEmpty(i,column2,row2,column2)){
                    //拐点找到,可消除，需要画线
                    let posArr = [[row1,column1],[i,column1],[i,column2],[row2,column2]];
                    this.drawLine(posArr);
                    return true;
                }
            }
            i = row1;
            while(--i >= 0){
                if(this.board[i][column1] > 0){
                    break;
                }
                if(this.board[i][column2]===0 && this.isRowEmpty(i,column1,i,column2) && this.isColumnEmpty(i,column2,row2,column2)){
                    //拐点找到,可消除，需要画线
                    let posArr = [[row1,column1],[i,column1],[i,column2],[row2,column2]];
                    this.drawLine(posArr);
                    return true;
                }
            }
        }
        return false;
    },

    // update (dt) {},
});
