/**
 * Created by Sergey.Luzyanin on 4/25/2017.
 */
(function(undefined){


    var CONNECTOR_MARGIN = 6.35;

    /**
    * @constructor
    * */
    function ConnectionParams(){
        this.bounds = new AscFormat.CGraphicBounds(0, 0, 0, 0);
        this.dir = AscFormat.CARD_DIRECTION_E;
        this.x = 0;
        this.y = 0;
        this.idx = 0;
    }
    ConnectionParams.prototype.copy = function(){
        var _c = new ConnectionParams();
        _c.bounds.fromOther(this.bounds);
        _c.dir = this.dir;
        _c.x = this.x;
        _c.y = this.y;
        _c.idx = this.idx;
        return _c;
    };
    ConnectionParams.prototype.transform = function(oTransform){
        this.bounds.transform(oTransform);
        //this.dir = AscFormat.CARD_DIRECTION_E;
        var _x = oTransform.TransformPointX(this.x, this.y);
        var _y = oTransform.TransformPointY(this.x, this.y);
        this.x = _x;
        this.y = _y;
    };

    function fCalculateSpPr(begin, end, sPreset, penW){
        return AscFormat.ExecuteNoHistory(function(){
            var oSpPr = new AscFormat.CSpPr();
            var oXfrm = new AscFormat.CXfrm();
            oSpPr.setXfrm(oXfrm);
            oXfrm.setParent(oSpPr);

            var _begin = begin.copy();
            var _end = end.copy();
            var fAngle = 0;

            if(!penW){
                penW = 12700;
            }

            switch(begin.dir){
                case AscFormat.CARD_DIRECTION_N:{
                    fAngle = Math.PI/2;
                    switch(_end.dir){
                        case AscFormat.CARD_DIRECTION_N:{
                            _end.dir = AscFormat.CARD_DIRECTION_E;
                            break;
                        }
                        case AscFormat.CARD_DIRECTION_S:{
                            _end.dir = AscFormat.CARD_DIRECTION_W;
                            break;
                        }
                        case AscFormat.CARD_DIRECTION_W:{
                            _end.dir = AscFormat.CARD_DIRECTION_N;
                            break;
                        }
                        case AscFormat.CARD_DIRECTION_E:{
                            _end.dir = AscFormat.CARD_DIRECTION_S;
                            break;
                        }
                    }
                    break;
                }
                case AscFormat.CARD_DIRECTION_S:{
                    fAngle = -Math.PI/2;
                    switch(_end.dir){
                        case AscFormat.CARD_DIRECTION_N:{
                            _end.dir = AscFormat.CARD_DIRECTION_W;
                            break;
                        }
                        case AscFormat.CARD_DIRECTION_S:{
                            _end.dir = AscFormat.CARD_DIRECTION_E;
                            break;
                        }
                        case AscFormat.CARD_DIRECTION_W:{
                            _end.dir = AscFormat.CARD_DIRECTION_S;
                            break;
                        }
                        case AscFormat.CARD_DIRECTION_E:{
                            _end.dir = AscFormat.CARD_DIRECTION_N;
                            break;
                        }
                    }
                    break;
                }
                case AscFormat.CARD_DIRECTION_W:{
                    fAngle = Math.PI;
                    switch(_end.dir){
                        case AscFormat.CARD_DIRECTION_N:{
                            _end.dir = AscFormat.CARD_DIRECTION_S;
                            break;
                        }
                        case AscFormat.CARD_DIRECTION_S:{
                            _end.dir = AscFormat.CARD_DIRECTION_N;
                            break;
                        }
                        case AscFormat.CARD_DIRECTION_W:{
                            _end.dir = AscFormat.CARD_DIRECTION_E;
                            break;
                        }
                        case AscFormat.CARD_DIRECTION_E:{
                            _end.dir = AscFormat.CARD_DIRECTION_W;
                            break;
                        }
                    }
                    break;
                }
                default:{
                    //East is default direction
                    fAngle = 0;
                    break;
                }
            }

            var oTransform = new AscCommon.CMatrix();
            AscCommon.global_MatrixTransformer.RotateRadAppend(oTransform, -fAngle);
            _begin.transform(oTransform);
            _end.transform(oTransform);

            var extX = Math.max(penW/36000.0, Math.abs(_end.x - _begin.x));
            var extY = Math.max(penW/36000.0, Math.abs(_end.y - _begin.y));
            var flipV = false;
            var flipH = false;
            var rot = 0;
            var oMapAdj = {};
            if(sPreset === "line"){
                flipH = (_begin.x > _end.x);
                flipV = (_begin.y > _end.y);
            }
            else{
                var sPrefix = "bentConnector";
                if(sPreset.indexOf("curvedConnector") > -1){
                    sPrefix = "curvedConnector";
                }
                //returns "bentConnector" by default
                switch(_end.dir){
                    case AscFormat.CARD_DIRECTION_N:{

                        if(_end.bounds.l > _begin.bounds.r){
                            if(_end.bounds.t < _begin.y){
                                if(_end.y <= _begin.y){
                                    sPreset = "4";
                                    flipV = true;
                                    oMapAdj["adj1"] = (100000*(((_begin.bounds.r + _end.bounds.l)/2  - _begin.x)/extX) + 0.5) >> 0;
                                    oMapAdj["adj2"] = (100000*(_begin.y - (_end.bounds.t - CONNECTOR_MARGIN))/extY + 0.5) >> 0;
                                }
                                else{
                                    sPreset = "4";
                                    oMapAdj["adj1"] = (100000*(((_begin.bounds.r + _end.bounds.l)/2  - _begin.x)/extX) + 0.5) >> 0;
                                    oMapAdj["adj2"] = (-100000*(  ( _begin.y - (_end.bounds.t - CONNECTOR_MARGIN) )/extY) + 0.5) >> 0;
                                }
                            }
                            else{
                                sPreset = "2";
                            }
                        }
                        else{
                            if(_end.bounds.t > _begin.bounds.b){
                                if(_end.x < _begin.x){
                                    sPreset = "4";
                                    flipH = true;
                                    oMapAdj["adj1"] = -((100000*(_begin.bounds.r + CONNECTOR_MARGIN - _begin.x)/extX + 0.5) >> 0);
                                    oMapAdj["adj2"] = (100000*((_end.bounds.t + _begin.bounds.b)/2.0 - _begin.y)/extY) >> 0;
                                }
                                else{
                                    sPreset = "2";
                                }

                            }
                            else if(_end.bounds.b < _begin.bounds.t){
                                if(_end.x < _begin.x){
                                    sPreset = "4";
                                    flipH = true;
                                    flipV = true;
                                    oMapAdj["adj1"] = -((100000*(_begin.bounds.r + CONNECTOR_MARGIN - _begin.x)/extX + 0.5) >> 0);
                                    oMapAdj["adj2"] = (100000*(_begin.y - (_end.bounds.t - CONNECTOR_MARGIN))/extY + 0.5) >> 0;
                                }
                                else{
                                    sPreset = "4";
                                    flipV = true;
                                    oMapAdj["adj1"] = (100000*(Math.max(_begin.bounds.r, _end.bounds.r) + CONNECTOR_MARGIN - _begin.x)/extX) >> 0;
                                    oMapAdj["adj2"] = (100000*(_begin.y - (_end.bounds.t - CONNECTOR_MARGIN))/extY + 0.5) >> 0;
                                }
                            }
                            else{

                                if(_end.y < _begin.y){
                                    if(_end.x < _begin.x){
                                        sPreset = "4";
                                        flipH = true;
                                        flipV = true;
                                        oMapAdj["adj1"] = -((100000*(_begin.bounds.r + CONNECTOR_MARGIN - _begin.x)/extX + 0.5) >> 0);
                                        oMapAdj["adj2"] = (100000*(_begin.y - (_end.bounds.t - CONNECTOR_MARGIN))/extY + 0.5) >> 0;
                                    }
                                    else {
                                        sPreset = "4";
                                        flipV = true;
                                        oMapAdj["adj1"] =  (100000*(Math.max(_begin.bounds.r, _end.bounds.r) + CONNECTOR_MARGIN - _begin.x)/extX + 0.5) >> 0;
                                        oMapAdj["adj2"] =  (100000*(_begin.y - (_end.bounds.t - CONNECTOR_MARGIN))/extY + 0.5) >> 0;
                                    }
                                }
                                else{
                                    if(_end.x > _begin.x){
                                        sPreset = "2";
                                    }
                                    else{
                                        sPreset = "4";
                                        flipH = true;
                                        oMapAdj["adj1"] =  -(100000*(Math.max(_begin.bounds.r, _end.bounds.r) + CONNECTOR_MARGIN - _begin.x)/extX + 0.5) >> 0;
                                        oMapAdj["adj2"] =  -((100000*(_begin.y - (Math.min(_begin.bounds.t, _end.bounds.t) - CONNECTOR_MARGIN))/extY + 0.5) >> 0);

                                    }

                                }
                            }
                        }
                        break;
                    }
                    case AscFormat.CARD_DIRECTION_S:{
                        if(_end.bounds.l > _begin.bounds.r){
                            if(_end.bounds.b < _begin.y){
                                sPreset = "2";
                                flipV = true;
                            }
                            else{
                                if(_end.y < _begin.y){
                                    sPreset = "4";
                                    flipV = true;
                                    oMapAdj["adj2"] = -((100000*((_end.bounds.b + CONNECTOR_MARGIN - _end.y)/extY) + 0.5) >> 0);
                                    oMapAdj["adj1"] = ((100000*(((_begin.bounds.r + _end.bounds.l)/2 - _begin.x))/extX) + 0.5) >> 0;
                                }
                                else{
                                    sPreset = "4";
                                    oMapAdj["adj1"] = (100000*(((_begin.bounds.r + _end.bounds.l)/2.0 - _begin.x)/extX) + 0.5) >> 0;
                                    oMapAdj["adj2"] = 100000 + ((100000*((_end.bounds.b + CONNECTOR_MARGIN - _end.y)/extY) + 0.5) >> 0);
                                }
                            }
                        }
                        else{
                            if(_end.bounds.b < _begin.bounds.t){

                                if(_end.x > _begin.bounds.r){
                                    sPreset = "2";
                                    flipV = true;
                                }
                                else{
                                    sPreset = "4";
                                    flipH = true;
                                    flipV = true;

                                    oMapAdj["adj1"] = -((100000*(_begin.bounds.r + CONNECTOR_MARGIN - _begin.x)/extX + 0.5) >> 0);
                                    oMapAdj["adj2"] =  (100000*(_begin.y - ((_end.bounds.b + _begin.bounds.t)/2.0))/extY + 0.5) >> 0;
                                }
                            }
                            else{

                                if(_end.x < _begin.x){
                                    if(_end.y > _begin.y){
                                        sPreset = "4";
                                        flipH = true;
                                        oMapAdj["adj1"] = -((100000*(Math.max(_begin.bounds.r, _end.bounds.r) + CONNECTOR_MARGIN - _begin.x)/extX + 0.5) >> 0);
                                        oMapAdj["adj2"] = (100000*((Math.max(_end.bounds.b, _begin.bounds.b) - _begin.y + CONNECTOR_MARGIN)/extY) + 0.5) >> 0;
                                    }
                                    else{
                                        sPreset = "4";
                                        flipH = true;
                                        flipV = true;
                                        oMapAdj["adj1"] = -((100000*(Math.max(_begin.bounds.r, _end.bounds.r) + CONNECTOR_MARGIN - _begin.x)/extX + 0.5) >> 0);
                                        oMapAdj["adj2"] = - (100000*((Math.max(_end.bounds.b, _begin.bounds.b) - _begin.y + CONNECTOR_MARGIN)/extY) + 0.5) >> 0;
                                    }
                                }
                                else{
                                    if(_end.y > _begin.y){
                                        sPreset = "4";

                                        oMapAdj["adj1"] = ((100000*(Math.max(_begin.bounds.r, _end.bounds.r) + CONNECTOR_MARGIN - _begin.x)/extX + 0.5) >> 0);
                                        oMapAdj["adj2"] = ((100000*(_end.bounds.b + CONNECTOR_MARGIN - _begin.y)/extY + 0.5) >> 0);
                                    }
                                    else{
                                        sPreset = "2";
                                        flipV = true;
                                    }
                                }
                            }
                        }
                        break;
                    }
                    case AscFormat.CARD_DIRECTION_W:{

                        if(_begin.x < _end.x){
                            sPreset = "3";
                            flipV = _begin.y > _end.y;
                        }
                        else{

                            sPreset = "5";
                            if(_end.bounds.t > _begin.bounds.b){

                                flipH = true;
                                oMapAdj["adj1"] =  -((100000*(_begin.bounds.r + CONNECTOR_MARGIN - _begin.x)/extX + 0.5) >> 0);
                                oMapAdj["adj2"] =   (100000*((_end.bounds.t + _begin.bounds.b)/2.0 - _begin.y)/extY + 0.5) >> 0;
                                oMapAdj["adj3"] =   (100000*(_begin.x - (_end.bounds.l - CONNECTOR_MARGIN))/extX + 0.5) >> 0;
                            }
                            else if(_end.bounds.b < _begin.bounds.t){
                                flipH = true;
                                flipV = true;
                                oMapAdj["adj1"] =  -((100000*(_begin.bounds.r + CONNECTOR_MARGIN - _begin.x)/extX + 0.5) >> 0);
                                oMapAdj["adj2"] =  (100000*(_begin.y - (_end.bounds.b + _begin.bounds.t)/2.0)/extY + 0.5) >> 0;
                                oMapAdj["adj3"] =   (100000*(_begin.x - (_end.bounds.l - CONNECTOR_MARGIN))/extX + 0.5) >> 0;
                            }
                            else{
                                if(_end.y > _begin.y){
                                    flipH = true;
                                    oMapAdj["adj1"] = -((100000*(_begin.bounds.r + CONNECTOR_MARGIN - _begin.x)/extX + 0.5) >> 0);
                                    oMapAdj["adj2"] =  (100000*(Math.max(_begin.bounds.b, _end.bounds.b) + CONNECTOR_MARGIN - _begin.y)/extY + 0.5) >> 0;
                                    oMapAdj["adj3"] =  (100000*(_begin.x - (_end.bounds.l - CONNECTOR_MARGIN))/extX + 0.5) >> 0;
                                }
                                else{
                                    flipH = true;
                                    flipV = true;
                                    oMapAdj["adj1"] = -((100000*(_begin.bounds.r + CONNECTOR_MARGIN - _begin.x)/extX + 0.5) >> 0);
                                    oMapAdj["adj2"] =  (100000*(_begin.y - (Math.min(_begin.bounds.t, _end.bounds.t) - CONNECTOR_MARGIN))/extY + 0.5) >> 0;
                                    oMapAdj["adj3"] =  (100000*(_begin.x - (_end.bounds.l - CONNECTOR_MARGIN))/extX + 0.5) >> 0;
                                }
                            }

                        }
                        break;
                    }
                    case AscFormat.CARD_DIRECTION_E:{
                        if(_end.bounds.l > _begin.bounds.r){
                            if(_end.bounds.b < _begin.y ){
                                sPreset = "3";
                                flipV = true;
                                oMapAdj["adj1"] = (100000*(_end.bounds.r + CONNECTOR_MARGIN - _begin.x)/extX) >> 0;
                            }
                            else if(_end.bounds.t > _begin.y){
                                sPreset = "3";

                                oMapAdj["adj1"] = 100000 + (100000*(CONNECTOR_MARGIN/extX) + 0.5) >> 0;

                            }
                            else{
                                if(_end.y < _begin.y){
                                    sPreset = "5";
                                    flipV = true;
                                    oMapAdj["adj1"] = (100000*((_end.bounds.l + _begin.bounds.r)/2 - _begin.x)/extX + 0.5) >> 0;
                                    oMapAdj["adj2"] =  (100000 + 100000*(_end.y  - (_end.bounds.t - CONNECTOR_MARGIN))/extY + 0.5) >> 0;
                                    oMapAdj["adj3"] = 100000 + (100000*(_end.bounds.r + CONNECTOR_MARGIN - _end.x)/extX + 0.5) >> 0;
                                }
                                else{
                                    sPreset = "5";
                                    oMapAdj["adj1"] = (100000*((_end.bounds.l + _begin.bounds.r)/2 - _begin.x)/extX + 0.5) >> 0;
                                    oMapAdj["adj2"] =  -(100000*(_begin.y  - (_end.bounds.t - CONNECTOR_MARGIN))/extY + 0.5) >> 0;
                                    oMapAdj["adj3"] = 100000 + (100000*(_end.bounds.r + CONNECTOR_MARGIN - _end.x)/extX + 0.5) >> 0;
                                }
                            }
                        }
                        else{
                            if(_end.x >= _begin.bounds.l || _end.y > _begin.bounds.b || _end.y < _begin.bounds.t){
                                if(_end.y < _begin.y){
                                    if(_end.x < _begin.x){
                                        flipH = true;
                                        flipV = true;
                                        sPreset = "3";
                                        oMapAdj["adj1"] = -(100000*(Math.max(_end.bounds.r, _begin.bounds.r) + CONNECTOR_MARGIN - _begin.x)/extX + 0.5) >> 0;
                                    }
                                    else {
                                        flipV = true;
                                        sPreset = "3";
                                        oMapAdj["adj1"] =  100000 + (100000*(Math.max(_end.bounds.r, _begin.bounds.r) + CONNECTOR_MARGIN - _end.x)/extX + 0.5) >> 0;
                                    }
                                }
                                else{
                                    if(_end.x < _begin.x){
                                        flipH = true;
                                        sPreset = "3";
                                        oMapAdj["adj1"] = -(100000*(Math.max(_end.bounds.r, _begin.bounds.r) + CONNECTOR_MARGIN - _begin.x)/extX + 0.5) >> 0;
                                    }
                                    else {
                                        sPreset = "3";
                                        oMapAdj["adj1"] =  100000 + (100000*(Math.max(_end.bounds.r, _begin.bounds.r) + CONNECTOR_MARGIN - _end.x)/extX + 0.5) >> 0;
                                    }
                                }
                            }
                            else{
                                if(_end.y >= _begin.y){
                                    sPreset = "5";
                                    flipH = true;
                                    oMapAdj["adj1"] = -((100000*(CONNECTOR_MARGIN/extX) + 0.5) >> 0);
                                    oMapAdj["adj2"] = (100000 + 100000*(_begin.bounds.b + CONNECTOR_MARGIN - _end.y)/extY + 0.5) >> 0;
                                    oMapAdj["adj3"] = (100000*(_begin.x - (_end.bounds.r + _begin.bounds.l)/2.0)/extX + 0.5) >> 0;
                                }
                                else{
                                    sPreset = "5";
                                    flipH = true;
                                    flipV = true;
                                    oMapAdj["adj1"] = -((100000*(CONNECTOR_MARGIN/extX) + 0.5) >> 0);
                                    oMapAdj["adj2"] = -(100000*(_begin.bounds.b + CONNECTOR_MARGIN - _begin.y)/extY + 0.5) >> 0;
                                    oMapAdj["adj3"] = (100000*(_begin.x - (_end.bounds.r + _begin.bounds.l)/2.0)/extX + 0.5) >> 0;
                                }
                            }
                        }
                        break;
                    }
                }
                sPreset = sPrefix + sPreset;
            }
            var _posX = (end.x + begin.x)/2.0 - extX/2.0;
            var _posY = (end.y + begin.y)/2.0 - extY/2.0;
            var _fAng = AscFormat.normalizeRotate(rot - fAngle);

            var oGeometry = AscFormat.CreateGeometry(sPreset);
            for(var key in oMapAdj){
                if(oMapAdj.hasOwnProperty(key)){
                    oGeometry.setAdjValue(key, oMapAdj[key]);
                }
            }
            oSpPr.setGeometry(oGeometry);
            oGeometry.setParent(oSpPr);
            oXfrm.setOffX(_posX);
            oXfrm.setOffY(_posY);
            oXfrm.setExtX(extX);
            oXfrm.setExtY(extY);
            oXfrm.setRot(_fAng);
            oXfrm.setFlipH(flipH);
            oXfrm.setFlipV(flipV);
            return oSpPr;

        }, this, []);
    }


    function fCalculateConnectionInfo(oConnInfo, x, y) {

        var oConnecInfo2 = new ConnectionParams();
        oConnecInfo2.x = x;
        oConnecInfo2.y = y;
        oConnecInfo2.bounds.fromOther(new AscFormat.CGraphicBounds(x, y, x, y));

        var diffX = x - oConnInfo.x;
        var diffY = y - oConnInfo.y;

        if(Math.abs(diffX) > Math.abs(diffY)){
            if(diffX < 0){
                oConnecInfo2.dir = AscFormat.CARD_DIRECTION_E;
            }
            else{
                oConnecInfo2.dir = AscFormat.CARD_DIRECTION_W;
            }
        }
        else{
            if(diffY < 0){
                oConnecInfo2.dir = AscFormat.CARD_DIRECTION_S;
            }
            else{
                oConnecInfo2.dir = AscFormat.CARD_DIRECTION_N;
            }
        }
        return oConnecInfo2;
    }

    function CConnectionShape() {
        AscFormat.CShape.call(this);
    }
    CConnectionShape.prototype = Object.create(AscFormat.CShape.prototype);
    CConnectionShape.prototype.constructor = CConnectionShape;

    CConnectionShape.prototype.calculateSpPr = function(begin, end){
    };

    CConnectionShape.prototype.getObjectType = function(begin, end){
        return AscDFH.historyitem_type_Cnx;
    };

    CConnectionShape.prototype.copy = function () {
        var copy = new CConnectionShape();
        this.fillObject(copy);
        return copy;
    };

    CConnectionShape.prototype.resetShape = function (oShape) {
        var cnxPr = this.nvSpPr.nvUniSpPr;

        if(cnxPr.stCnxId === oShape.Id || cnxPr.endCnxId === oShape.Id){
            var oNewPr = cnxPr.copy();
            if(cnxPr.stCnxId === oShape.Id){
                oNewPr.stCnxId = null;
                oNewPr.stCnxIdx = null;
            }
            if(cnxPr.endCnxId === oShape.Id){
                oNewPr.endCnxId = null;
                oNewPr.endCnxIdx = null;
            }
            this.nvSpPr.setUniSpPr(oNewPr);
        }
    };

    window['AscFormat'] = window['AscFormat'] || {};
    window['AscFormat'].fCalculateSpPr = fCalculateSpPr;
    window['AscFormat'].fCalculateConnectionInfo = fCalculateConnectionInfo;
    window['AscFormat'].ConnectionParams = ConnectionParams;
    window['AscFormat'].CConnectionShape = CConnectionShape;
})();