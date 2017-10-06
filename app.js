var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var mysql = require('mysql');
var bodyParser = require("body-parser");
var multer = require('multer');
var crypto = require('crypto');
var s = require('multer');

var connection = mysql.createConnection({
    host : 'soc.neonjogja.com',
    user : 'neonjogj_soc',
    password : 'neonjogj_soc',
    database : 'neonjogj_soc',
});

// var connection = mysql.createConnection({
//     host : 'localhost',
//     user : 'root',
//     password : '',
//     database : 'db_cattloo',
// });
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

connection.connect(function (err) {
    if (!err){
        console.log("Database terkoneksi");
    } else {
        console.log("Database tidak terhubung");
    }
})

var storage = multer.diskStorage({
    destination: './image/transaksi',
    filename: function(req, file, cb) {
        return crypto.pseudoRandomBytes(16, function(err, raw) {
            if (err) {
                return cb(err);
            }
            return cb(null, "" + (raw.toString('hex')) + (path.extname(file.originalname)));
        });
    }


});


app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/',function(req,res){
    var data = {
        "Data":""
    };
    data["Data"] = "Hello Semoet";
    res.json(data);
});

//ambil report paket
app.get('/getPeriksaSoal',function (req,res) {
    var data = {
    };
    connection.query("select * from `tb_report-paket`", function (err, rows, fields) {
        if (rows.length !=0){
            data["ReportPaket"] = rows;
            res.json(data);
        } else{
            data["SuratPengantar"] = 'Tidak Ada Data Surat Pengantar';
            res.json(data);
        }
    })
});

//ambil sekolah id
app.get('/get_id_sekolah',function (req,res) {
    var data = {
    };
    connection.query("SELECT `sekolahID`, sklh.namaSekolah  FROM `tb_report-paket` `rp` " +
        " JOIN `tb_sekolah_pengguna` `sp` ON rp.`id_pengguna` = sp.`penggunaID` " +
        " JOIN tb_sekolah sklh ON sklh.id = sp.sekolahID " +
        " WHERE `sp`.`penggunaID` ="+req.query.penggunaID+" " +
        " GROUP BY sekolahID", function (err, rows, fields) {
        if (rows.length !=0){
            data["SekolahID"] = rows;
            res.json(data);
        } else{
            data["SekolahID"] = 'Tidak Ada Data ID Sekolah';
            res.json(data);
        }
    })
});

//ambil nilai berdasarkan sekolah
app.get('/get_nilai_by_sekolah',function (req,res) {
    var data = {
    };
    connection.query("SELECT `pk`.`nm_paket` as nama_paket ,tr.`nm_tryout` as nama_try, MAX(`total_nilai`) AS nilai_tertinggi,  MIN(`total_nilai`) AS nilai_terendah, AVG(`total_nilai`) AS `rata`  FROM `tb_report-paket` rp " +
        " JOIN `tb_mm-tryoutpaket` mmtr ON `rp`.`id_mm-tryout-paket` = `mmtr`.`id` " +
        " JOIN `tb_paket` pk ON `mmtr`.`id_paket` = `pk`.`id_paket` " +
        " JOIN `tb_tryout` tr ON `mmtr`.`id_tryout` = `tr`.`id_tryout` " +
        " JOIN `tb_sekolah_pengguna` sp ON rp.`id_pengguna` = sp.`penggunaID` " +
        " WHERE `sp`.`sekolahID` =" +req.query.sekolahID+" " +
        " GROUP BY `pk`.`id_paket`", function (err, rows, fields) {
        if (rows.length !=0){
            data["NilaiSekolah"] = rows;
            res.json(data);
        } else{
            data["NilaiSekolah"] = 'Tidak Ada Data Nilai Sekolah';
            res.json(data);
        }
    })
});


//ambil report berdasarkan pengguna
app.get('/get_report_by_pengguna',function (req,res) {
    var data = {
    };
    connection.query("SELECT * FROM ( SELECT * FROM `tb_report-paket` WHERE id_pengguna = "+req.query.id_pengguna+" ) AS p " +
        " JOIN `tb_mm-tryoutpaket` mm ON mm.`id` = p.`id_mm-tryout-paket` " +
        " JOIN `tb_paket` pkt ON pkt.`id_paket` = mm.`id_paket` " +
        "JOIN tb_tryout t ON t.`id_tryout` = mm.`id_tryout`", function (err, rows, fields) {
        if (rows.length !=0){
            data["ReportPengguna"] = rows;
            res.json(data);
        } else{
            data["ReportPengguna"] = 'Tidak Ada Data Report Berdasarkan Pengguna';
            res.json(data);
        }
    })
});

//ambil siswa berdasarkan sekolah
app.get('/get_siswa_at_school',function (req,res) {
    var data = {
    };
    connection.query("SELECT s.`id`, `namaDepan`, `namaBelakang`, `alamat`, `noKontak`, s.`penggunaID`, `photo`, `biografi`, s.`status` " +
        " FROM (SELECT * FROM `tb_sekolah_pengguna` sp WHERE sp.`sekolahID` = "+req.query.sekolahID+" ) sekop " +
        " JOIN tb_pengguna p ON p.`id` = sekop.penggunaID " +
        " JOIN tb_siswa s ON s.`penggunaID` = p.`id` ", function (err, rows, fields) {
        if (rows.length !=0){
            data["ReportPengguna"] = rows;
            res.json(data);
        } else{
            data["ReportPengguna"] = 'Tidak Ada Data Report Berdasarkan Pengguna';
            res.json(data);
        }
    })
});

//ambil pengguna yang akan tryout
app.get('/get_pengguna_on_tryout',function (req,res) {
    var data = {
    };
    connection.query("SELECT p.id,namaPengguna, kataSandi, eMail, regTime, aktivasi, avatar `oauth_uid`," +
        " `oauth_uid`,hakAkses,p.status, last_akses " +
        " FROM (SELECT * FROM `tb_sekolah_pengguna` sp WHERE sp.`sekolahID` = "+req.query.sekolahID+" ) sekop " +
        " JOIN tb_pengguna p ON p.`id` = sekop.penggunaID " +
        " JOIN tb_siswa s ON s.`penggunaID` = p.`id` ", function (err, rows, fields) {
        if (rows.length !=0){
            data["PenggunaOnTryout"] = rows;
            res.json(data);
        } else{
            data["PenggunaOnTryout"] = 'Tidak Ada Data Report Berdasarkan Pengguna';
            res.json(data);
        }
    })
});

//ambil hak akses di tryout tertentu
app.get('/get_hak_akses_on_tryout',function (req,res) {
    var data = {
    };
    connection.query("SELECT * FROM `tb_hakakses-to` ha WHERE id_tryout = "+req.query.id_tryout+" ", function (err, rows, fields) {
        if (rows.length !=0){
            data["HakAkses"] = rows;
            res.json(data);
        } else{
            data["HakAkses"] = 'Tidak Ada Data Report Berdasarkan Pengguna';
            res.json(data);
        }
    })
});

// ambil tryout berdasarkan to
app.get('/get_to_by_id',function (req,res) {
    var data = {
    };
    connection.query("SELECT * FROM `tb_tryout` WHERE id_tryout = "+req.query.id_tryout+" ", function (err, rows, fields) {
        if (rows.length !=0){
            data["To"] = rows;
            res.json(data);
        } else{
            data["To"] = 'Tidak Tryout';
            res.json(data);
        }
    })
});


//ambil soal di TO tertentu
app.get('/get_soal_on_tryout',function (req,res) {
    var data = {
    };
    connection.query("SELECT p.id_soal,judul_soal, soal, jawaban, kesulitan, sumber,audio, " +
        " b.`create_by`, b.random, b.publish, b.UUID, b.status, gambar_soal, " +
        " pembahasan, gambar_pembahasan, video_pembahasan, status_pembahasan, link " +
        " FROM `tb_banksoal` b " +
        " JOIN `tb_mm-paketbank` p ON b.`id_soal` = p.`id_soal` " +
        " JOIN tb_paket pk ON pk.`id_paket` = p.`id_paket` " +
        " JOIN `tb_mm-tryoutpaket` mmp ON mmp.`id_paket` = pk.`id_paket` " +
        " JOIN `tb_tryout` t ON t.`id_tryout` = mmp.`id_tryout` WHERE t.`id_tryout` = "+req.query.id_tryout, function (err, rows, fields) {
        if (rows.length !=0){
            data["Soal"] = rows;
            res.json(data);
        } else{
            data["Soal"] = 'Tidak Ada Data Report Berdasarkan Pengguna';
            res.json(data);
        }
    })
});

//ambil relasi MM paket
app.get('/get_mm_paket',function (req,res) {
    var data = {
    };
    connection.query("SELECT mm.id,mm.`id_paket`,mm.id_soal " +
        " FROM `tb_mm-paketbank` mm JOIN `tb_banksoal` b ON mm.`id_soal` = b.`id_soal` " +
        " JOIN tb_paket p ON p.`id_paket` = mm.`id_paket` " +
        " JOIN `tb_mm-tryoutpaket` mmp ON mmp.`id_paket` = p.`id_paket` " +
        " JOIN `tb_tryout` t ON t.`id_tryout` = mmp.`id_tryout` " +
        " WHERE t.`id_tryout` ="+req.query.id_tryout, function (err, rows, fields) {
        if (rows.length !=0){
            data["MMPaket"] = rows;
            res.json(data);
        } else{
            data["MMPaket"] = 'Tidak Ada Data Report Berdasarkan Pengguna';
            res.json(data);
        }
    })
});

//ambil PILIHAN JAWABAN YANG ADA DI TO TERTENTU
app.get('/get_pilihan_jawaban',function (req,res) {
    var data = {
    };
    connection.query("SELECT pj.`id_pilihan`,pj.`pilihan`,pj.`jawaban`,pj.`id_soal`,pj.`gambar` " +
        " FROM `tb_mm-paketbank` mm " +
        " JOIN `tb_banksoal` b ON mm.`id_soal` = b.`id_soal` " +
        " JOIN tb_paket p ON p.`id_paket` = mm.`id_paket` " +
        " JOIN `tb_mm-tryoutpaket` mmp ON mmp.`id_paket` = p.`id_paket` " +
        " JOIN `tb_tryout` t ON t.`id_tryout` = mmp.`id_tryout` " +
        " JOIN `tb_piljawaban` pj ON pj.`id_soal` = b.`id_soal` " +
        " WHERE t.`id_tryout` = "+req.query.id_tryout, function (err, rows, fields) {
        if (rows.length !=0){
            data["PilihanJawaban"] = rows;
            res.json(data);
        } else{
            data["PilihanJawaban"] = 'Tidak Ada Data Report Berdasarkan Pengguna';
            res.json(data);
        }
    })
});


//ambil admin offline
app.get('/check_user_admin_offline',function (req,res) {
    var data = {
    };
    connection.query("SELECT `pengguna`.`id` as `penggunaID`, `namaPengguna`, `hakAkses`, `s`.`id` as `sekolahID`, `aktivasi`, `regTime`, `pengguna`.`email` " +
        " FROM `tb_pengguna` `pengguna` " +
        " JOIN `tb_sekolah_pengguna` `sp` " +
        " ON `sp`.`penggunaID` = `pengguna`.`id` " +
        " JOIN `tb_sekolah` `s` ON `s`.`id` = `sp`.`sekolahID` " +
        " WHERE `kataSandi` = '"+req.query.kataSandi+"' AND `pengguna`.`status` = 1 " +
        " AND `pengguna`.`hakAkses` = 'pengawas' AND (namaPengguna='"+req.query.namaPengguna+"' OR eMail='"+req.query.eMail+"') ", function (err, rows, fields) {
        if (rows.length !=0){
            data["AdminOffline"] = rows;
            res.json(data);
        } else{
            data["AdminOffline"] = false;
            res.json(data);
        }
    })
});

//GET TO YANG HAK AKSESNYA ID PENGGUNA TERTENTU
app.get('/get_all_to',function (req,res) {
    var data = {
    };
    connection.query("SELECT t.`id_tryout`,t.`nm_tryout`,t.`tgl_mulai`,t.`tgl_berhenti`,t.`publish`,t.`UUID`,t.`wkt_mulai`,t.`wkt_berakhir`,t.`penggunaID` FROM `tb_hakakses-pengawas` hp " +
        " JOIN `tb_tryout` t ON t.`id_tryout` = hp.`id_tryout` " +
        " JOIN tb_sekolah_pengguna s ON s.`id` = hp.`id_pengawas` " +
        " JOIN tb_pengguna u ON u.`id` = s.`penggunaID` " +
        " WHERE s.`penggunaID`="+req.query.penggunaID, function (err, rows, fields) {
        if (rows.length !=0){
            data["TryoutPengguna"] = rows;
            res.json(data);
        } else{
            // data["TryoutPengguna"] = 'Tidak Ada Data Report Berdasarkan Pengguna';
            // res.json(data);
            data["TryoutPengguna"] = rows;
            res.json(data);
            return rows;
        }
    })
});

// get pasangan tryout mm paket
app.get('/get_mm_tryout_paket',function (req,res) {
    var data = {
    };
    connection.query("SELECT mm.id, mm.id_paket, mm.id_tryout FROM `tb_mm-tryoutpaket` mm " +
        " WHERE `id_tryout` ="+req.query.id_tryout, function (err, rows, fields) {
        if (rows.length !=0){
            data["TryoutPengguna"] = rows;
            res.json(data);
        } else{
            // data["TryoutPengguna"] = 'Tidak Ada Data Report Berdasarkan Pengguna';
            // res.json(data);
            return false;
        }
    })
});

//ambil nilai max dari sekolah
app.get('/get_max_by_sekolah',function (req,res) {
    var data = {
    };
    connection.query("SELECT s.namaDepan, s.namaBelakang, pkt.nm_paket, sklh.namaSekolah, " +
        " pkt.jenis_penilaian, pkt.jumlah_soal,p.jmlh_benar,p.jmlh_salah, " +
        " pkt.jenis_penilaian, IF(jenis_penilaian='UNBK' ,MAX(ROUND(jmlh_benar/jumlah_soal * 100)), " +
        " ROUND(MAX(((jmlh_benar*4) - (jmlh_salah*1))  / (jumlah_soal*4)*100))) AS nilai_max " +
        " FROM (SELECT * FROM tb_sekolah_pengguna WHERE sekolahID = "+req.query.sekolahID+" ) AS sekolah " +
        " JOIN `tb_report-paket` p ON p.id_pengguna = sekolah.penggunaID " +
        " JOIN `tb_mm-tryoutpaket` mmpkt ON mmpkt.id = p.`id_mm-tryout-paket` " +
        " JOIN tb_paket pkt ON pkt.id_paket = mmpkt.id_paket " +
        " JOIN tb_pengguna u ON u.id = p.id_pengguna " +
        " JOIN tb_siswa s ON s.penggunaID = u.id " +
        " JOIN tb_sekolah sklh ON sklh.id = sekolah.sekolahID " +
        " GROUP BY pkt.jenis_penilaian", function (err, rows, fields) {
        if (rows.length !=0){
            data["MaxSekolah"] = rows;
            res.json(data);
        } else{
            // data["TryoutPengguna"] = 'Tidak Ada Data Report Berdasarkan Pengguna';
            // res.json(data);
            return false;
        }
    })
});

//ambil nilai min dari sekolah
app.get('/get_min_by_sekolah',function (req,res) {
    var data = {
    };
    connection.query("SELECT s.namaDepan, s.namaBelakang, pkt.nm_paket, sklh.namaSekolah, " +
        " pkt.jenis_penilaian, pkt.jumlah_soal,p.jmlh_benar,p.jmlh_salah, " +
        " pkt.jenis_penilaian, IF(jenis_penilaian='UNBK' ,MIN(ROUND(jmlh_benar/jumlah_soal * 100)), " +
        " ROUND(MIN(((jmlh_benar*4) - (jmlh_salah*1))  / (jumlah_soal*4)*100))) AS nilai_min " +
        " FROM (SELECT * FROM tb_sekolah_pengguna WHERE sekolahID = "+req.query.sekolahID+" ) AS sekolah " +
        " JOIN `tb_report-paket` p ON p.id_pengguna = sekolah.penggunaID " +
        " JOIN `tb_mm-tryoutpaket` mmpkt ON mmpkt.id = p.`id_mm-tryout-paket` " +
        " JOIN tb_paket pkt ON pkt.id_paket = mmpkt.id_paket " +
        " JOIN tb_pengguna u ON u.id = p.id_pengguna " +
        " JOIN tb_siswa s ON s.penggunaID = u.id " +
        " JOIN tb_sekolah sklh ON sklh.id = sekolah.sekolahID " +
        " GROUP BY pkt.jenis_penilaian", function (err, rows, fields) {
        if (rows.length !=0){
            data["MinSekolah"] = rows;
            res.json(data);
        } else{
            // data["TryoutPengguna"] = 'Tidak Ada Data Report Berdasarkan Pengguna';
            // res.json(data);
            return false;
        }
    })
});


//ambil data pengguna
app.get('/check_pengguna',function (req,res) {
    var data = {
    };
    connection.query("SELECT * FROM `tb_pengguna` `pengguna` WHERE `kataSandi` = '"+req.query.kataSandi+"' AND `pengguna`.`status` = '1' " +
        "AND (namaPengguna='"+req.query.namaPengguna+"' OR eMail='"+req.query.eMail+"') ", function (err, rows, fields) {
        if (rows.length !=0){
            data["DataPengguna"] = rows;
            res.json(data);
        } else{
            data["DataPengguna"] = 'Tidak Ada Data Pengguna';
            res.json(data);
        }
    })
});

app.post('/addReport',function (req,res){
    var data = {};
    dl={
        'siswaID':req.body.siswaID,
        'id_pengguna':req.body.id_pengguna,
        'id_mm_tryout_paket':req.body.id_mm_tryout_paket,
        'jmlh_kosong':req.body.jmlh_kosong,
        'jmlh_benar':req.body.jmlh_benar,
        'jmlh_salah':req.body.jmlh_salah,
        'total_nilai':req.body.total_nilai,
        'poin':req.body.poin,
        'tgl_pengerjaan':req.body.tgl_pengerjaan,
        'status_pengerjaan':req.body.status_pengerjaan,
        'rekap_hasil_koreksi':req.body.rekap_hasil_koreksi
    };
    var sql = "INSERT INTO `tb_report-paket`(id_report,siswaID,id_pengguna,`id_mm-tryout-paket`,"+
        "jmlh_kosong,jmlh_benar,jmlh_salah,total_nilai,poin,"+
        "tgl_pengerjaan,status_pengerjaan,rekap_hasil_koreksi)"+
        "VALUES"+
        "('',"+dl.siswaID+","+dl.id_pengguna+","+dl.id_mm_tryout_paket+","+dl.jmlh_kosong+","+dl.jmlh_benar+","+
        dl.jmlh_salah+","+dl.total_nilai+","+dl.poin+",'"+dl.tgl_pengerjaan+"',"+dl.status_pengerjaan+",'"+
        dl.rekap_hasil_koreksi+"')";

    connection.query(sql, function (err, result) {
        if (err) throw err;
        data['statusInsert'] = "Berhasil di insert report"
    });
    res.json(data);
});

//ambil nilai max dari pengguna
app.get('/get_max_pengguna',function (req,res) {
    var data = {
    };
    connection.query("SELECT id_pengguna, mnth.nama_paket, MAX(nilai) as terbesar FROM " +
        " (SELECT id_pengguna, pkt.nm_paket nama_paket,jenis_penilaian, " +
        " CASE jenis_penilaian " +
        " WHEN 'UNBK' THEN jmlh_benar/jumlah_soal * 100 " +
        " WHEN 'SBMPTN' THEN ((jmlh_benar*4) - (jmlh_salah*1)  / (jumlah_soal*4)*100) " +
        " END AS nilai " +
        " FROM ( SELECT * FROM `tb_report-paket` WHERE id_pengguna = "+req.query.id_pengguna+") AS p " +
        " JOIN `tb_mm-tryoutpaket` mm ON mm.`id` = p.`id_mm-tryout-paket` " +
        " JOIN `tb_paket` pkt ON pkt.`id_paket` = mm.`id_paket`  " +
        " JOIN tb_tryout t ON t.`id_tryout` = mm.`id_tryout`) mnth", function (err, rows, fields) {
        if (rows.length !=0){
            data["NilaiMax"] = rows;
            res.json(data);
        } else{
            data["NilaiMax"] = 'Tidak Ada Data Pengguna';
            res.json(data);
        }
    })
});

//ambil nilai min dari pengguna
app.get('/get_min_pengguna',function (req,res) {
    var data = {
    };
    connection.query("SELECT id_pengguna, mnth.nama_paket, MIN(nilai) as terkecil FROM " +
        " (SELECT id_pengguna, pkt.nm_paket nama_paket,jenis_penilaian, " +
        " CASE jenis_penilaian " +
        " WHEN 'UNBK' THEN jmlh_benar/jumlah_soal * 100 " +
        " WHEN 'SBMPTN' THEN ((jmlh_benar*4) - (jmlh_salah*1)  / (jumlah_soal*4)*100) " +
        " END AS nilai " +
        " FROM ( SELECT * FROM `tb_report-paket` WHERE id_pengguna = "+req.query.id_pengguna+") AS p " +
        " JOIN `tb_mm-tryoutpaket` mm ON mm.`id` = p.`id_mm-tryout-paket` " +
        " JOIN `tb_paket` pkt ON pkt.`id_paket` = mm.`id_paket`  " +
        " JOIN tb_tryout t ON t.`id_tryout` = mm.`id_tryout`) mnth", function (err, rows, fields) {
        if (rows.length !=0){
            data["NilaiMin"] = rows;
            res.json(data);
        } else{
            data["NilaiMin"] = 'Tidak Ada Data Pengguna';
            res.json(data);
        }
    })
});

// get paket by toid
app.get('/get_paket_by_toid',function (req,res) {
    var data = {
    };
    connection.query("SELECT p.token, p.id_paket,nm_paket,deskripsi,p.status,jumlah_soal,durasi,random,jenis_penilaian FROM `tb_paket` p " +
        " JOIN `tb_mm-tryoutpaket` mm " +
        " ON p.`id_paket` = mm.`id_paket` " +
        " JOIN `tb_tryout` t ON t.`id_tryout` = mm.`id_tryout` " +
        "WHERE t.`id_tryout` = "+req.query.id_tryout, function (err, rows, fields) {
        if (rows.length !=0){
            data["PilihanJawaban"] = rows;
            res.json(data);
        } else{
            data["PilihanJawaban"] = 'Tidak Ada Data Report Berdasarkan Pengguna';
            res.json(data);
        }
    })
});

//ambil tryout untuk di home
app.get('/get_tryout_home',function (req,res) {
    var data = {
    };
    connection.query("SELECT nm_tryout, pkt.nm_paket FROM ( SELECT * FROM `tb_report-paket` WHERE id_pengguna = "+req.query.id_pengguna+" ) AS p " +
        " JOIN `tb_mm-tryoutpaket` mm ON mm.`id` = p.`id_mm-tryout-paket` " +
        " JOIN `tb_paket` pkt ON pkt.`id_paket` = mm.`id_paket` " +
        " JOIN tb_tryout t ON t.`id_tryout` = mm.`id_tryout`", function (err, rows, fields) {
        if (rows.length !=0){
            data["TryoutHome"] = rows;
            res.json(data);
        } else{
            data["TryoutHome"] = 'Tidak Ada Data Report Berdasarkan Pengguna';
            res.json(data);
        }
    })
});


//ambil id paket
app.get('/get_id_paket',function (req,res) {
    var data = {
    };
    connection.query("SELECT `id_paket` FROM `tb_mm-tryoutpaket` WHERE `id` = "+req.query.id, function (err, rows, fields) {
        if (rows.length !=0){
            data["IdPaket"] = rows;
            res.json(data);
        } else{
            data["IdPaket"] = 'Tidak Ada Data Pengguna';
            res.json(data);
        }
    })
});

//ambil soal
app.get('/get_soal',function (req,res) {
    var data = {
    };
    connection.query("SELECT `id_paket` AS `idpak`, `soal` AS `soal`, `soal`.`id_soal` AS `soalid`, `soal`.`judul_soal` " +
        " AS `judul`, `soal`.`gambar_soal` AS `gambar`, `soal`.`jawaban` AS `jaw`, `soal`.`pembahasan`, `soal`.`gambar_pembahasan`, " +
        " `soal`.`video_pembahasan`, `soal`.`status_pembahasan`, `soal`.`link` FROM `tb_mm-paketbank` AS `paban` " +
        " JOIN `tb_banksoal` AS `soal` ON `paban`.`id_soal` = `soal`.`id_soal` " +
        " WHERE `paban`.`id_paket` = "+req.query.id_paket, function (err, rows, fields) {
        if (rows.length !=0){
            data["Soal"] = rows;
            res.json(data);
        } else{
            data["Soal"] = 'Tidak Ada Data Pengguna';
            res.json(data);
        }
    })
});


//ambil pilihan jawaban
app.get('/get_pilihan_jawaban_to',function (req,res) {
    var data = {
    };
    connection.query("SELECT *, `id_paket` AS `idpak`, `soal` AS `soal`, `pil`.`id_soal` AS `pilid`, `soal`.`id_soal` " +
        " AS `soalid`, `pil`.`pilihan` AS `pilpil`, `pil`.`jawaban` AS `piljaw`, `pil`.`gambar` AS `pilgam` " +
        " FROM `tb_mm-paketbank` AS `paban` JOIN `tb_banksoal` AS `soal` ON `paban`.`id_soal` = `soal`.`id_soal` " +
        " JOIN `tb_piljawaban` AS `pil` ON `soal`.`id_soal` = `pil`.`id_soal` " +
        " WHERE `paban`.`id_paket` = "+req.query.id_paket+" and `soal`.`id_soal` = "+req.query.id_soal, function (err, rows, fields) {
        if (rows.length !=0){
            data["PilihanJawaban"] = rows;
            res.json(data);
        } else{
            data["PilihanJawaban"] = 'Tidak Ada Data Pengguna';
            res.json(data);
        }
    })
});

// Add data invoidce
app.post('/addInvoice',function (req,res){

    var kodeInvoice = req.body.kode_invoice;
    var buktiTransfer = "http://localhost:5500/image/transaksi/"+s;
    var tglBayar = req.body.tgl_bayar;
    var nominal = req.body.nominal;
    var idBelanja = req.body.id_belanja;
    var namaPemilikRekening= req.body.nama_pemilik_rekening;
    var bankPengirim = req.body.bank_pengirim;
    var data ={
        "error":1,
        "Add Invoice":""
    };
    if(!!buktiTransfer && !!tglBayar && !!nominal && !!idBelanja && !!namaPemilikRekening && !!bankPengirim){
        connection.query("INSERT INTO invoice VALUES(?,?,?,?,?,?,?)",[kodeInvoice,buktiTransfer,tglBayar,nominal,idBelanja,namaPemilikRekening,bankPengirim],function(err,rows,fields){
            if(!!err){
                data["Invoice"] = "kesalahan penambahan invoice";
                console.log("masuk ke error");
                console.log("yaaaannggggg  itu "+s);
                console.log("file jpg"+s);
                ;
            }else{
                data["error"] = 0;
                data["Invoice"] = "Data invoice telah berhasil ditambahkan";
                console.log("yaaaannggggg  itu "+buktiTransfer);
                console.log("file jpg"+s);
            }
            res.json(data);
        });
        console.log("file jpg buat disimpen didb : "+buktiTransfer);
    }else{
        data["Informasi"] = "inputkan data berdasarkan (i.e : )";
        res.json(data);
    }
});



http.listen(3000, '0.0.0.0',function(){
    console.log("Connected & Listen to port 3000");
    console.log(connection);
    app.use('/image', express.static(path.join(__dirname, 'image')));
});