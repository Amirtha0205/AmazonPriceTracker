var express=require('express');

var nodemailer=require('nodemailer');
const cheerio=require('cheerio');
const path = require('path');
const storage= require('node-sessionstorage');
const bp=require('body-parser');
const axios=require('axios');
const http=require('http')
var app=express();

const mysql=require('mysql');
const { count } = require('console');

app.use(bp.urlencoded({
    extended:true
  }));

var con=mysql.createConnection({
    host: "localhost",
    user: "root",
    database:"users_fav_url"
})
con.connect(function(err) {
    if (err) throw err;
    console.log("connected");
  });

app.get('/',function(req,res){
    //res.render('./login.html');
    res.sendFile(path.join(__dirname +'/login.html'))
    //res.redirect('/login.html');
})
app.get('/login.html',function(req,res){ 
    res.sendFile(path.join(__dirname +'/login.html'))
})
app.get('/url',function(req,res){ 
    res.sendFile(path.join(__dirname +'/index.html'))
})
app.get('/signup.html',function(req,res){
    res.sendFile(path.join(__dirname +'/signup.html'))
})

app.post('/login',function(req,res){
    
    var sql1="INSERT INTO user_details(name,email,password,phone) values (?,?,?,?)";
    var a=[String(req.body.name),String(req.body.email),String(req.body.pass),(req.body.phone)];
    con.query(sql1,a,(err,result)=>{
        if(err){
             console.log(err);
        }
        else{
            console.log("result is",result);
            res.redirect('http://localhost:3301');
          }
    })
});
app.post('/goin',function(req,res){
    storage.setItem("email",String(req.body.email));
    var sql5="Select count(*) from user_details where email=? and secretcode=?"
    console.log((req.body.pass));
    var ab=[String(req.body.email),String(req.body.pass)];
    con.query(sql5,ab,(err,result)=>{
        if(err){
             console.log(err);
        }
        else{
            var e=(JSON.parse(JSON.stringify(result)));
            console.log("result is",result);
            console.log(e[0]['count(*)']); 
            var g=e[0]['count(*)'];
            if (g==1){
                console.log("result is",result);
                res.sendFile(path.join(__dirname +'/index.html'))
            }                  
        }
    })
});

app.post('/url',function(req,res){
    var p=storage.getItem('email');
    console.log(p);
    var a=0;
    
    axios(String(req.body.url))
    .then(resu=> {          
        const html=resu.data;
        const $ = cheerio.load(html);
        var t = $('span[class="a-price aok-align-center reinventPricePriceToPayPadding priceToPay"] span[class="a-offscreen"]').text();
        console.log('rrrr',t);
        var e=t.length;
        var t=t.slice(1,e);
        a=t.replace(/\,/g,''); 
        a=parseInt(a,10);            
        a=(Math.round(a));
        console.log('rrrr',a);
        var sql2="INSERT INTO users_url(email_id,url_site,price,original_price) values (?,?,?,?)"
    
        var ab=[p,String(req.body.url),a-(parseInt(String(req.body.num))),a];
        con.query(sql2,ab,(err,result)=>{
        if(err){
             console.log(err);
        }
        else{
            var e=(JSON.parse(JSON.stringify(result)));
            console.log("resullllllllllllt is",e);       
            res.redirect('http://localhost:3301/url');
           
        }
    })
    }); 
});

app.post('/showdata',function(req,res){
    var p=storage.getItem('email');
    var data;
    var sql4="SELECT * FROM users_url where email_id=?";
    
   // var ab=[p,String(req.body.url),String(req.body.num)];
    con.query(sql4,p,(err,result)=>{
        if(err){
             console.log(err);
        }
        else{           
            data=result;          
        }
        res.send({data:data});    
    })
});

app.post('/a',function(req,res){
        
        var sql3="SELECT *,(SELECT COUNT(*) FROM users_url)FROM users_url";
        con.query(sql3,(err,result)=>{
            if(err){
                 console.log(err);
            }
            else{                         
                var e=(JSON.parse(JSON.stringify(result)));
            console.log("result is",e);
            console.log("result is",e[0]);
            console.log("result is",e[1]);
            var g=parseInt(e[0]['(SELECT COUNT(*) FROM users_url)']);
            for (i = 0; i <(g); i++)
            {                  
           var item = e[i];               
            if(parseInt(e[parseInt(i)].price)>parseInt(e[parseInt(i)].original_price)) 
            {
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    host: 'smtp.gmail.com',
                    port: 587,
                  secure: false,
                    auth: {
                      user: 'kans***********@gmail.com', //For my seurity, I changed the email-id
                      pass: '' //For my seurity, I changed the password
                    },
                    tls:{
                        rejectUnauthorized:false
                    }
                  });
                  var mailOptions = {
                    from: 'kans***********@gmail.com',
                    to: e[i].email_id,
                    subject: "Your favorite product's price in cart section has been reduced.",
                    text: e[i].url_site+"has been reduced to"+e[i].original_price
                  };
                  
                  transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                      console.log(error);
                    } else {
                      console.log('Email sent: ' + info.response);
                    }
                  });
           }
           else{
          
              console.log("Didnt reduce",e[i].price,e[i].original_price);
           }              
            }
            }              
        })
    });
    
app.listen(3301)