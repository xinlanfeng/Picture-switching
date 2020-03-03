//1.对图片进行分类
//2.生成dom元素
//3.绑定事件
//4.显示到页面上

//自执行函数
(function(window,document){

    //设定一个变量来判断是否可以进行下一次按钮的切换（true为可以切换，false表示不能切换） --- 解决过快切换分类带来的有些设置了setTimeout的变量值未能及时获取的问题
    let canChange = true;

    //设置一个索引，记录当前点击放大的图片是第几张
    let curPreviewImgIndex = 0;

    //公共方法的实现与封装
    const methods = {
        //往页面上添加节点的方法
        append(parent, ...children){
            children.forEach(el => {
                parent.appendChild(el);
            });
        },

        //选择一个元素querySelector  methods.$("selector") 相当于 document(root).querySelector("selector")
        $(selector, root = document){
            return root.querySelector(selector);
        },

        //选择多个元素querySelectorAll ethods.$$("selector") 相当于 document(root).querySelectorAll("selector")
        $$(selector, root = document){
            return root.querySelectorAll(selector);
        }
    };

    //构造函数
    let Img = function(options){
        //调用函数，执行这些方法
        this._init(options);
        this._createElement();
        this._bind();
        this._show();
    }

    //1.初始化变量，对图片进行分类
    Img.prototype._init = function({data, initType, parasitifer}){
        this.types = ['全部']; //存放所有的分类
        this.all = []; //存放所有图片元素  -- 在分类时对图片进行初始化，把每一个图片变成具体的图片元素
        this.classified = {'全部':[]}; //按照类型分类后的图片，key : value = 类别 ： 该类别下面的图片组成的数组（该数组里面存放的是all[]所有的图片中这些图片对应的下标）
        this.curType = initType; //当前显示到的图片分类
        this.parasitifer = methods.$(parasitifer); //挂载点，在哪一个dom元素下实现图片切换的特效

        this._classify(data);//调用图片分类的函数，对进行图片分类
        // console.log(this.types);
        // console.log(this.all);
        // console.log(this.classified);

        this.imgContainer = null; //所有图片的(div)容器
        this.container = null; //整体容器
        this.typeBtnEls = null; //所有分类按钮组成的数组
        this.figures = null; //所有当前显示的图片组成的数组
        this.overlay = null; //遮罩层
        this.previewImg = null; //要显示在遮罩层的图片
    };

    //1.1 对图片进行分类
    Img.prototype._classify = function(data){
        //每一张图片的信息在data.js这个文件中

        let srcs = [];//存放所有图片的src路径

        //data里面存放了所有图片的所有信息
        data.forEach(({title, type, alt, src}) => {
            //types这个数组中是否有当前图片的type，没有就写入数组
            if(!this.types.includes(type)){
                this.types.push(type);
            }

            //classified这个按图片类型分类后的对象的key(type)值，是否有当前图片的type，没有就写入对象中
            if(!Object.keys(this.classified).includes(type)){
                this.classified[type] = [];
            }

            if(!srcs.includes(src)){
                //如果图片没有生成过，就生成图片，添加到对应的分类中

                //将当前图片存放到srcs数组中，表示当前图片已经生成过了
                srcs.push(src);

                //生成图片 (添加图片的HTML元素） -- 一张图片的HTML结构 <figure> <img /> <figcaption></figcaption> </figure>
                let figure = document.createElement('figure');
                let img = document.createElement('img');
                let figcaption = document.createElement('figcaption');

                //设置图片的属性
                img.src = src;
                img.setAttribute('alt',alt);
                figcaption.innerText = title;

                //将img 与 figcaption 添加到 figure 元素上
                methods.append(figure,img,figcaption);

                //将生成的图片元素添加到存放所有图片的all数组中，push添加的位置是数组的最后一个
                this.all.push(figure);

                //将生成的图片(all数组的最后一个成员的下标)的  下标 添加到对应的type分类中
                this.classified[type].push(this.all.length - 1);
            }
            else{
                //如果图片已经生成过，就去 all或srcs 中找到对应的图片，将该图片对应的下标，添加到对应的分类中
                this.classified[type].push(srcs.findIndex(s1 => s1 === src));
            }
        })
    }

    //2.1 根据分类获取图片
    Img.prototype._getImgsByType = function(type){
        //如果是全部类别就返回全部图片
        //如果是某一指定类别就返回对应类别的图片, 记住classified里面放的是每种类型图片的value是对应的数组all的下标
        return type === "全部" ? [...this.all] : this.classified[type].map(index => this.all[index]); //数组的map方法返回的是一个数组
    }

    //2.生成dom元素
    Img.prototype._createElement = function(){
        //创建分类按钮
        //typesBtn存放所有分类按钮的html文本
        let typesBtn = [];

        //遍历types数组，生成分类按钮
        for(let type of this.types.values()){                     //如果当前分类时一开始就要显示的分类，就加上css的选中当前按钮的样式，否则不加（因为只能同时有一个按钮被选中，样式变为被选中的样式）
            typesBtn.push(`<li class="__Img__classify__type-btn ${type === this.curType ? ' __Img__type-btn-active' : ''}">${type}</li>`);
        }
        // console.log(typesBtn);

        //--------------------------------------------------------

        //整体HTML模板(图片 和 按钮 的html在前面已经生成过了)
        let tamplate = `
                    <ul class="__Img__classify">
                        ${typesBtn.join('')}
                    </ul>
                    <div class="__Img__img-container"></div>`;
                    
        //根据index.html的结构，外面还有一层className为__Img__container的div，div包裹着tamplate
        let container = document.createElement('div');
        container.className = '__Img__container';
        container.innerHTML = tamplate;

        //选择container的className为__Img__img-container的元素
        this.imgContainer = methods.$('.__Img__img-container',container);

        //往图片容器imgContainer里面添加图片元素  --- 根据上面写好的getImgsByType方法
        methods.append(this.imgContainer, ...this._getImgsByType(this.curType));

        this.container = container;
        //console.log(this.container);
        //取出所有的按钮
        this.typeBtnEls = [...methods.$$('.__Img__classify__type-btn', container)];//记得把类数组转换成真正的数组
        //取出所有当前分类的图片
        this.figures = [...methods.$$('figure',container)];//记得把类数组转换成真正的数组

        //--------------------------------------------------------

        //遮罩层
        let overlay = document.createElement('div');
        overlay.className = "__Img__overlay";
        overlay.innerHTML = `
            <div class="__Img__overlay-prev-btn"></div>
            <div class="__Img__overlay-next-btn"></div>
            <img src="" alt="">`;

        methods.append(this.container, overlay);
        this.overlay = overlay;

        //要显示在遮罩层的图片
        this.previewImg = methods.$('img', overlay);

        //调用方法，解决高度塌陷和图片重叠在一起的问题
        this._calcPosition(this.figures);
    };

    //3.1 判断当前的分类按钮和下一个分类按钮之间重复的图片
    Img.prototype._diff = function(prevImgs, nextImgs){
        //diffArr数组中保存了，当前分类图片prevImgs和下一分类图片nextImgs之间的映射关系
        //如：prevImgs : [1,2,3,5,6] 
        //    nextImgs : [3,6,11,12,14]  p和n数组存储的是图片的src
        //则： diffArr : [[2,0],[4,1]]  diff存储的是图片的src的对应的下标
        let diffArr = [];

        prevImgs.forEach((src1, index1) => {
            let index2 = nextImgs.findIndex(src2 => src1 === src2);

            if(index2 !== -1){
                diffArr.push([index1,index2]);
            }
        });

        return diffArr;
    }

    //3.绑定事件
    Img.prototype._bind = function(){
        
        //总体思路：让当前分类的不重复的图片隐藏并从imgContainer容器中移除（让当前分类的重复的图片保留），并把下一分类的不重复的图片添加到imgContainer中
        //始终记住只有添加到imgContainer这个div容器中的元素才能在页面中显示，transform = 'scale(1,1) translate(0, 0)只是决定它的显示效果，并不能让他真正添加到页面上
        
        //将点击按钮事件委托到ul上
        methods.$('.__Img__classify', this.container).addEventListener('click',({target})=>{
            if(target.nodeName !== 'LI') return;
            //console.log(target.innerText); //输出点击的按钮的名称

            //判断canChange的值，判断当前按钮是否可以进行切换
            if(!canChange) return;
            canChange = false; //在setTimeout(,600)图片消失动画未完成前设置canChange为false

//----------  找出重复的图片 ---------------------------------------------------

            const type = target.innerText;
            const els = this._getImgsByType(type);

            //当前显示的图片的src
            let prevImgs = this.figures.map(figure => methods.$('img',figure).src);

            //下一个点击的按钮的分类应该显示的图片src
            let nextImgs = els.map(figure => methods.$('img',figure).src);

            //调用diff方法，找出当前分类图片prevImgs和下一分类图片nextImgs之间的映射关系
            const diffArr = this._diff(prevImgs, nextImgs);
            // console.log(diffArr);

//---------------  结束  ---------------------------------------------------------------


//---------------  找出当前分类的不重复的图片，隐藏并从imgContainer容器中移除 ----------------------------------

            //当前分类与下一分类有重复图片时，切换特效是隐藏不重复的图片，重复的图片直接平移过来
            //所以，需要去掉当前分类与下一分类重复的图片，然后把不重复的图片全部隐藏了
            //i2表示下一分类的图片与当前分类重复的图片的nextImgs下标
            diffArr.forEach(([,i2]) => {
                this.figures.every((figure, index) => {
                    //取出当前分类的图片的src
                    let src = methods.$('img',figure).src;

                    if(src === nextImgs[i2]){
        //-------------------------------------------------------------------------
                        //去掉当前分类的图片的数组中与下一分类重复的图片
                        this.figures.splice(index,1);
         //-------------------------------------------------------------------------
                        return false; //数组的every方法遇到fasle就会停止
                    }
                    return true;
                });
            });

            this.figures.forEach(el => {
                //注意此时的this.figures里面存放的已经是当前分类与下一分类不重复的图片
                //点击下一分类按钮时，隐藏当前分类的与下一分类不重复的图片
                el.style.transform = 'scale(0,0) translate(0%, 100%)';
                el.style.opacity = '0';
            });

            //动画结束后，销毁以前figures中的图片，然后重新给figures赋值，让下一分类的图片els变成当前分类的图片
            //this.firgues重新赋值后，Img.prototype._show也就能进行图片的显示了
            setTimeout(() => {
                //注意此时的this.figures里面存放的已经是当前分类的与下一分类不重复的图片
                this.figures.forEach(figure => {
                    this.imgContainer.removeChild(figure);
                });

                this.figures = els;

                //在setTimeout(,600)图片消失动画完成后，设置canChange为true
                canChange = true;

            }, 600);//css中动画的持续时间为600ms

//---------------  结束  ----------------------------------------------------------------------------


//-------------------- 找出下一分类的不重复的图片，并添加到imgContainer中 ---------------------------------

            //将当前图片与下一分类重复的图片过滤，将需要重新添加到页面的不重复的图片找出来
            let needAppendEls = [];//下一分类中的不重复的图片
            if(diffArr.length){
                //nextElsIndex存储当前与下一分类重复图片的nextImgs的下标
                let nextElsIndex = diffArr.map(([,i2])=>i2);

                els.forEach((figure, index) =>{
                    //nextElsIndex.includes(index)表示重复的图片的下标
                    if( ! nextElsIndex.includes(index) ){
                        needAppendEls.push(figure);
                    }
                });
            }
            else{
                needAppendEls = els;
            }

            //将下一分类的不重复的图片needAppendEls全部添加到imgContainer图片容器中
            methods.append(this.imgContainer, ...needAppendEls);

//-------------------------结束---------------------------------------------------------


//------------------ 设置下一分类所有图片的显示效果 --------------------------------------

            //调用函数计算下一分类的图片的高度宽度位置等信息
            this._calcPosition(els);

            //设置所有图片的显示效果
            setTimeout(()=>{
                els.forEach(el => {
                    el.style.transform = 'scale(1,1) translate(0, 0)';
                    el.style.opacity = '1';
                });
            },0);
//--------------------------结束----------------------------------------------------
        

        //--------------------设置分类按钮的选中样式（选中后为红底白字，未选中为白底红字）-----------------------------------------
            
            //把所有按钮的选中样式都去掉
            this.typeBtnEls.forEach(btn => {
                btn.className = '__Img__classify__type-btn';
            })

            //将触发点击事件的按钮的样式设置为选中状态
            target.className = '__Img__classify__type-btn __Img__type-btn-active';
        //------------------------结束-----------------------------------------------------
        
        });
        //-------------------------点击按钮切换分类事件结束 -------------------------------------
    
        //------------------------点击图片放大及点击遮罩层隐藏的实现-----------------------------

        //点击图片放大
        this.imgContainer.addEventListener('click',({target})=>{
            if(target.nodeName !== 'FIGURE' && target.nodeName !== 'FIGCAPTION') return;
            // alert("1");
            if(target.nodeName === 'FIGCAPTION'){
                target = target.parentNode; //如果点击的是图片的名字就换成父节点figure标签
            }

            //拿到figure下面img标签的src，并把这个src赋给遮罩层img 的src,实现图片的预览
            const src = methods.$('img',target).src;
            this.previewImg.src = src;

            //记录当前点击的图片是是第几张（在figure中的索引）
            //findIndex()函数是返回第一个满足条件的数组的下标
            curPreviewImgIndex = this.figures.findIndex(figure => (src === methods.$('img',figure).src));

            //设置遮罩层的display为flex及opacity，遮罩层的css默认为display:none, opacity:0
            this.overlay.style.display = 'flex';
            setTimeout(()=>{
                this.overlay.style.opacity = '1';
            },0);
        });

        //点击遮罩层隐藏图片(有一个300ms的动画), 设置opacity为0，设置display为none
        this.overlay.addEventListener('click',()=>{
            this.overlay.style.opacity = '0';

            setTimeout(()=>{
                this.overlay.style.display = 'none';
            },300);
        });

        //----------------------------结束---------------------------------------------

        //------------------------上一张和下一张按钮的实现-----------------------------
        //点击上一张下一张按钮时要阻止事件冒泡 stopPropagation();，防止其向上冒泡触发overlay遮罩层的点击事件
        //上一张
        methods.$('.__Img__overlay-prev-btn', this.overlay).addEventListener('click',e=>{
            e.stopPropagation();//阻止冒泡
            //如果当前是第一张图片，就让其索引设为最后一张，达到循环的目的
            curPreviewImgIndex = (curPreviewImgIndex === 0 ? this.figures.length - 1 : curPreviewImgIndex - 1);
            //让遮罩层图片的src等于curPreviewImgIndex索引对应的那一张图片的src
            this.previewImg.src = methods.$('img',this.figures[curPreviewImgIndex]).src;
        });

        //下一张
        methods.$('.__Img__overlay-next-btn', this.overlay).addEventListener('click',e=>{
            e.stopPropagation();
            curPreviewImgIndex = (curPreviewImgIndex === this.figures.length - 1 ? 0 : curPreviewImgIndex + 1);
            this.previewImg.src = methods.$('img',this.figures[curPreviewImgIndex]).src;
        });
        //----------------------------结束--------------------------------------------

    };


    //4.显示到页面上
    Img.prototype._show = function(){
        //将container添加到挂载点上
        methods.append(this.parasitifer,this.container);

        //css中所有figure一开始 transform: scale(0,0) 不透明度opacity:0 也为0 默认都是看不见的
        //使用一个0s的定时器解决图片显示时没有动画的问题
        setTimeout(()=>{
            this.figures.forEach(figure => {
                figure.style.transform = 'scale(1,1) translate(0, 0)';
                figure.style.opacity = '1';
            });
        },0);
    };

    //实现一个方法，解决高度塌陷和图片重叠在一起的问题
    Img.prototype._calcPosition = function(figures){

        //horizontallImgIndex保存的是当前图片是第几张 /（当前图片的列数 - 1）
        let horizontalImgIndex = 0;
        
        //图片的div是绝对定位的
        figures.forEach((figure, index) => {
            //根据图片在第几行，算出其绝对定位的top值
            //根据图片在第几列，算出其绝对定位的left值

            //一行4张图片,计算这张图片在第几行: (parseInt(index/4))+1
            //top = （图片的行数-1）* 一张图片的高度140px + （图片的行数-1）* 图片与图片之间的缝隙15px
            figure.style.top = parseInt(index/4) * 140 + parseInt(index/4) * 15 + 'px';

            //left = (图片的列数 - 1) * 一张图片的宽度240px + (图片的列数 - 1) * 图片与图片之间的缝隙15px
            figure.style.left = horizontalImgIndex * 240 + horizontalImgIndex * 15 + 'px';

            figure.style.transform = 'scale(0,0) translate(0, -100%)';

            //当horizontalImgIndex开始新的一行后，需要重新计算列数,从 0 开始计算
            horizontalImgIndex = (horizontalImgIndex + 1) % 4; //取余
        });

        //-------------------------------------

        //解决imgContainer高度塌陷
        //imgContainer的高度 = 当前分类图片的总行数 * 每张图片高度140px + 当前分类图片的总行数 * 图片与图片之间的缝隙15px
        let  hang = Math.ceil(figures.length / 4); //或者 hang = parseInt(figures.length / 4) + 1
        this.imgContainer.style.height = hang * 140 + hang * 15 +'px';
    };

    //将Img挂载到window上暴露给全局，以便在任意地方都可以直接调用
    window.$Img = Img;

})(window, document);