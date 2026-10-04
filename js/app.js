/** E-Warungku — Frontend (GitHub Pages). Komunikasi ke backend lewat api() di js/api.js. Token sesi disimpan di sessionStorage (hilang saat tab ditutup). */
const KAT=['Elektronik','Makanan','Minuman','Pakaian','Perlengkapan Rumah Tangga','Furniture','Bahan Bangunan'];
const ST=['Baru Masuk','Diproses','Siap Diambil','Dikirim','Selesai','Cancel'];
const PAY=['Cash','QRIS','Transfer','E-Wallet'];
const BKAT=['Listrik','Air','Internet','Sewa','Gaji','Maintenance','Lainnya'];
const NAV={
  admin:[['dashboard','speedometer2','Dashboard'],['kasir','cash-stack','Kasir POS'],['stok','box-seam','Stok & Barang'],['opname','clipboard-check','Opname Stok'],['pesanan','truck','Pesanan & Resi'],['riwayat','clock-history','Riwayat Transaksi'],['laporan','bar-chart-line','Laporan'],['beban','wallet2','Beban Operasional'],['karyawan','people','Kelola Pengguna'],['pengaturan','gear','Pengaturan']],
  karyawan:[['kasir','cash-stack','Kasir POS'],['stok','box-seam','Stok & Barang'],['pesanan','truck','Pesanan & Resi'],['riwayat','clock-history','Riwayat Transaksi'],['pengaturan','gear','Pengaturan']],
  pelanggan:[['katalog','shop','E-Katalog'],['pesanan','receipt','Pesanan Saya'],['pengaturan','gear','Akun Saya']]};
const S={token:null,user:null,barang:[],cart:{pos:[],shop:[]},kat:'',q:'',reg:false,ch:[]};
const $=id=>document.getElementById(id);
const rp=n=>'Rp '+Math.round(Number(n)||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const price=b=>Number(b.HargaDiskon)||Number(b.HargaJual);
const opts=a=>a.map(x=>`<option>${esc(x)}</option>`).join('');
const M=id=>bootstrap.Modal.getOrCreateInstance($(id));
const foto=(b,th)=>b.FotoId?`<img referrerpolicy="no-referrer" class="ph ${th?'th':''}" src="https://drive.google.com/thumbnail?id=${encodeURIComponent(b.FotoId)}&sz=w${th?100:400}" alt="${esc(b.Nama)}" loading="lazy">`:`<div class="ph ph0 ${th?'th':''}"><i class="bi bi-image"></i></div>`;

/* ── Util UI ── */
function toast(msg,type){const d=document.createElement('div');d.className='toast-x '+(type||'info');d.setAttribute('role','status');d.textContent=msg;$('toasts').appendChild(d);setTimeout(()=>d.remove(),3800);}
function call(fn,args,ok,btn){ // api() (fetch ke GAS) + loading tombol + error ke toast
  if(btn)btn.disabled=true;
  api(fn,args)
    .then(r=>{if(btn)btn.disabled=false;if(r.success){if(ok)ok(r.data,r.message);}else fail(r.message);})
    .catch(e=>{if(btn)btn.disabled=false;fail(e.message);});
}
function fail(m){toast(m,'danger');if(/^Sesi berakhir/.test(m))resetUI();}
function toggleTheme(){const h=document.documentElement,n=h.dataset.theme==='dark'?'light':'dark';h.dataset.theme=n;try{localStorage.setItem('ew_theme',n)}catch(e){}}
function dlB64(b64,name,mime){const bin=atob(b64),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);
  const u=URL.createObjectURL(new Blob([a],{type:mime})),l=document.createElement('a');l.href=u;l.download=name;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);}
function ask(title,label,cb,type){$('inTtl').textContent=title;$('inLbl').textContent=label;$('inVal').type=type||'number';$('inVal').value='';$('inOk').onclick=()=>{const v=$('inVal').value.trim();if(!v)return $('inVal').focus();cb(v,$('inOk'));};M('mInput').show();}

/* ── Auth ── */
function saveSess(){try{sessionStorage.setItem('ew_sess',JSON.stringify({token:S.token,user:S.user}))}catch(e){}}
function toggleReg(){S.reg=!S.reg;$('rgName').classList.toggle('d-none',!S.reg);$('authTitle').textContent=S.reg?'Daftar Pelanggan Baru':'Masuk ke Akun Anda';$('btnAuth').textContent=S.reg?'Buat Akun':'Masuk';$('btnToggle').textContent=S.reg?'Sudah punya akun? Masuk':'Daftar sebagai Pelanggan Baru';$('p').minLength=S.reg?8:6;}
function doAuth(e){
  e.preventDefault();const u=$('u').value,p=$('p').value,b=$('btnAuth');
  if(S.reg)return call('registerPelanggan',[u,p,$('nm').value,$('em').value],(_,m)=>{toast(m,'success');toggleReg();},b);
  call('doLogin',[u,p],d=>{S.token=d.token;S.user=d;saveSess();enter();},b);
}
function enter(){
  ['pos','shop'].forEach(k=>{try{S.cart[k]=JSON.parse(localStorage.getItem('ew_'+k)||'[]')}catch(e){S.cart[k]=[]}});
  $('authView').classList.add('d-none');$('appView').classList.remove('d-none');
  $('who').textContent=S.user.nama+' · '+S.user.role;
  $('nav').innerHTML=NAV[S.user.role].map(n=>`<a href="javascript:void(0)" data-s="${n[0]}" onclick="go('${n[0]}')"><i class="bi bi-${n[1]}"></i> ${n[2]}${n[0]==='pesanan'?'<span id="navBadge" class="pill bad ms-auto d-none"></span>':''}</a>`).join('');
  $('selKat').innerHTML=opts(KAT);build();startPoll();
  call('getBarang',[S.token],d=>{S.barang=d;go(NAV[S.user.role][0][0]);});
}
function logout(){api('doLogout',[S.token]).catch(()=>{});resetUI();}
function resetUI(){stopPoll();try{sessionStorage.removeItem('ew_sess')}catch(e){}S.token=null;S.user=null;$('appView').classList.add('d-none');$('authView').classList.remove('d-none');$('p').value='';}

/* ── Navigasi SPA (0ms, tanpa server) ── */
function go(id){
  document.querySelectorAll('.sec').forEach(s=>s.classList.toggle('on',s.id==='sec-'+id));
  document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.s===id));
  $('ttl').textContent=NAV[S.user.role].find(n=>n[0]===id)[2];$('side').classList.remove('show');
  ({dashboard:loadDash,kasir:renderGrids,stok:renderStok,opname:renderOpname,pesanan:loadPesanan,riwayat:loadRiwayat,laporan:renderLaporan,beban:renderBeban,karyawan:loadUsers,pengaturan:renderPengaturan,katalog:renderGrids})[id]();
}

/* ── Keranjang (optimistic + localStorage) ── */
function saveCart(k){try{localStorage.setItem('ew_'+k,JSON.stringify(S.cart[k]))}catch(e){}}
function cAdd(k,id){
  const b=S.barang.find(x=>x.ID===id);if(!b||b.Stok<1)return toast('Stok habis','warning');
  const c=S.cart[k],x=c.find(i=>i.id===id);
  if(x){if(x.qty>=b.Stok)return toast('Melebihi stok tersedia','warning');x.qty++;}else c.push({id,qty:1});
  saveCart(k);renderCart(k);
}
function cQty(k,id,d){
  const x=S.cart[k].find(i=>i.id===id),b=S.barang.find(y=>y.ID===id);if(!x)return;
  x.qty=Math.min(x.qty+d,b?b.Stok:x.qty);if(x.qty<1)S.cart[k]=S.cart[k].filter(i=>i!==x);
  saveCart(k);renderCart(k);
}
const cTotal=k=>S.cart[k].reduce((s,i)=>{const b=S.barang.find(x=>x.ID===i.id);return s+(b?price(b)*i.qty:0)},0);
function renderCart(k){
  const el=$('cart-'+k);if(!el)return;S.cart[k]=S.cart[k].filter(i=>S.barang.some(b=>b.ID===i.id));
  el.innerHTML=S.cart[k].length?S.cart[k].map(i=>{const b=S.barang.find(x=>x.ID===i.id);
    return `<div class="line"><div class="grow"><b>${esc(b.Nama)}</b><small>${rp(price(b))}</small></div><div class="qty"><button aria-label="Kurangi" onclick="cQty('${k}','${i.id}',-1)">−</button><span>${i.qty}</span><button aria-label="Tambah" onclick="cQty('${k}','${i.id}',1)">+</button></div><b>${rp(price(b)*i.qty)}</b></div>`}).join(''):'<p class="empty">Keranjang kosong</p>';
  $('tot-'+k).textContent=rp(cTotal(k));if(k==='pos')calcKem();
}
function adjStock(id,d){const b=S.barang.find(x=>x.ID===id);if(b)b.Stok=Number(b.Stok)+d;}
function refreshBarang(cb){call('getBarang',[S.token],d=>{S.barang=d;if(cb)cb();renderGrids();});}

/* ── Katalog & grid produk ── */
const stokPill=n=>n<1?'<span class="pill bad">Habis</span>':n<10?`<span class="pill warn"><i class="bi bi-exclamation-triangle"></i> Menipis (${n})</span>`:`<span class="pill ok">Tersedia ${n}</span>`;
function prodCards(k){
  const l=S.barang.filter(b=>b.Status!=='Nonaktif'&&(!S.kat||b.Kategori===S.kat)&&(!S.q||(b.Nama+b.ID).toLowerCase().includes(S.q)));
  return l.map(b=>{const d=Number(b.HargaDiskon)>0;return `<div class="prod ${b.Stok<1?'off':''}"><div class="pwrap">${d?`<span class="tag">HEMAT ${Math.round(100-b.HargaDiskon/b.HargaJual*100)}%</span>`:''}${foto(b)}</div><small class="cat">${esc(b.Kategori)}</small><h3>${esc(b.Nama)}</h3>${stokPill(b.Stok)}${d?`<s>${rp(b.HargaJual)}</s>`:''}<div class="price">${rp(price(b))}</div><button class="btn btn-brand w-100" ${b.Stok<1?'disabled':''} onclick="cAdd('${k}','${b.ID}')"><i class="bi bi-cart-plus"></i> ${k==='pos'?'Tambah':'Keranjang'}</button></div>`}).join('')||'<p class="empty">Barang tidak ditemukan</p>';
}
function renderGrids(){
  ['pos','shop'].forEach(k=>{const g=$('grid-'+k);if(g){g.innerHTML=prodCards(k);renderCart(k);}});
  document.querySelectorAll('.chips').forEach(c=>c.innerHTML=['',...KAT].map(x=>`<button class="${S.kat===x?'on':''}" onclick="setKat('${x}')">${x||'Semua'}</button>`).join(''));
}
function setKat(k){S.kat=k;renderGrids();}
function setQ(v){S.q=v.trim().toLowerCase();renderGrids();}
const searchBar=`<div class="bar"><input class="form-control" placeholder="Cari nama atau kode barang…" aria-label="Cari barang" oninput="setQ(this.value)"><div class="chips"></div></div>`;
function build(){
  $('sec-katalog').innerHTML=`<div class="hero"><h1>Promo <span>Spesial</span> Warung</h1><p class="mb-0">Harga hemat, bayar Cash / QRIS / Transfer.</p></div>${searchBar}
  <div class="row g-3"><div class="col-lg-8"><div class="grid" id="grid-shop"></div></div><div class="col-lg-4"><div class="card-x sticky"><h3><i class="bi bi-bag"></i> Keranjang</h3><div id="cart-shop"></div>
  <div class="totbox"><span>TOTAL</span><b id="tot-shop">Rp 0</b></div>
  <label for="ambil">Pengambilan</label><select id="ambil" class="form-select" onchange="$('alamat').classList.toggle('d-none',this.value!=='Dikirim')"><option>Ambil Sendiri</option><option>Dikirim</option></select>
  <textarea id="alamat" class="form-control mt-2 d-none" placeholder="Alamat pengiriman lengkap"></textarea>
  <label for="metode-shop">Metode Pembayaran</label><select id="metode-shop" class="form-select">${opts(PAY)}</select>
  <button id="btnOrder" class="btn btn-accent w-100 mt-3" onclick="checkout()">Pesan Sekarang</button></div></div></div>`;
  $('sec-kasir').innerHTML=`${searchBar}<div class="row g-3"><div class="col-lg-7"><div class="grid" id="grid-pos"></div></div><div class="col-lg-5"><div class="card-x sticky"><h3><i class="bi bi-receipt"></i> Struk Penjualan</h3>
  <input id="plg" class="form-control mb-2" placeholder="Nama pelanggan (wajib untuk Piutang)" aria-label="Nama pelanggan"><div id="cart-pos"></div>
  <div class="totbox"><span>TOTAL TAGIHAN</span><b id="tot-pos">Rp 0</b></div>
  <label for="metode-pos">Cara Pembayaran</label><select id="metode-pos" class="form-select" onchange="calcKem()">${opts(PAY)}<option value="Piutang">Piutang (Bon)</option></select>
  <div id="cashBox"><label for="bayar">Uang Diterima</label><input id="bayar" type="number" min="0" class="form-control" oninput="calcKem()"><div id="kem" class="kem">Kembalian: Rp 0</div></div>
  <button id="btnPay" class="btn btn-brand w-100 mt-3" onclick="payPOS()"><i class="bi bi-printer"></i> Selesaikan &amp; Cetak Struk</button></div></div></div>`;
}
function checkout(){
  const c=S.cart.shop;if(!c.length)return toast('Keranjang kosong','warning');
  const kirim=$('ambil').value==='Dikirim',al=$('alamat').value.trim();if(kirim&&!al)return toast('Isi alamat pengiriman','warning');
  call('placeOrder',[S.token,{items:c,metode:$('metode-shop').value,alamat:kirim?al:'Ambil Sendiri'}],r=>{
    c.forEach(i=>adjStock(i.id,-i.qty));S.cart.shop=[];saveCart('shop');renderGrids();toast('Pesanan terkirim! No. resi: '+r.resi,'success');go('pesanan');refreshBarang();pollNotif();},$('btnOrder'));
}

/* ── Kasir POS ── */
function calcKem(){
  const m=$('metode-pos').value==='Cash';$('cashBox').classList.toggle('d-none',!m);
  $('kem').textContent='Kembalian: '+rp(Math.max(0,Number($('bayar').value||0)-cTotal('pos')));
}
function payPOS(){
  const c=S.cart.pos;if(!c.length)return toast('Struk masih kosong','warning');
  const m=$('metode-pos').value,tot=cTotal('pos'),by=Number($('bayar').value||0),plg=$('plg').value.trim();
  if(m==='Cash'&&by<tot)return toast('Uang diterima kurang','warning');
  if(m==='Piutang'&&!plg)return toast('Isi nama pelanggan untuk Piutang','warning');
  call('processSale',[S.token,{items:c,metode:m,bayar:by,pelanggan:plg}],r=>{
    c.forEach(i=>adjStock(i.id,-i.qty));S.cart.pos=[];saveCart('pos');$('bayar').value='';$('plg').value='';renderGrids();
    toast('Berhasil '+rp(r.total)+(r.kembalian?' · kembalian '+rp(r.kembalian):''),'success');refreshBarang();showInv(r.id,'struk');},$('btnPay'));
}

/* ── Stok & master barang (+ foto) ── */
let stokQ='';
function renderStok(){
  const adm=S.user.role==='admin';
  $('sec-stok').innerHTML=`<div class="d-flex flex-wrap gap-2 mb-3"><input class="form-control w-auto flex-grow-1" placeholder="Cari kode / nama" aria-label="Cari barang" oninput="stokQ=this.value.toLowerCase();stokRows()">${adm?'<button class="btn btn-brand" onclick="editBarang()"><i class="bi bi-plus-lg"></i> Tambah Barang</button>':''}</div>
  <div class="row g-3"><div class="col-xl-8"><div class="card-x p-0 tbl"><table class="table"><thead><tr><th></th><th>Kode</th><th>Barang</th><th class="text-end">Modal</th><th class="text-end">Jual</th><th class="text-end">Stok</th><th></th></tr></thead><tbody id="stokBody"></tbody></table></div></div>
  <div class="col-xl-4"><form class="card-x" onsubmit="submitMasuk(event)"><h3><i class="bi bi-box-arrow-in-down"></i> Form Barang Masuk</h3>
  <label>Barang</label><select name="id" class="form-select" required>${S.barang.filter(b=>b.Status!=='Nonaktif').map(b=>`<option value="${esc(b.ID)}">${esc(b.ID)} – ${esc(b.Nama)}</option>`).join('')}</select>
  <label>Qty Masuk</label><input name="qty" type="number" min="1" class="form-control" required>
  <label>Harga Beli / pcs</label><input name="hb" type="number" min="1" class="form-control" required>
  <label>Supplier</label><input name="sup" class="form-control">
  <label>Tanggal Kadaluarsa (makanan/minuman)</label><input name="exp" type="date" class="form-control">
  <label>Pembayaran ke Supplier</label><select name="bayar" class="form-select" onchange="this.form.tempo.parentElement.classList.toggle('d-none',this.value!=='Hutang')"><option>Cash</option><option>Hutang</option></select>
  <div class="d-none"><label>Jatuh Tempo Hutang</label><input name="tempo" type="date" class="form-control"></div>
  <button class="btn btn-brand w-100 mt-3">Catat &amp; Tambah Stok</button></form></div></div>`;
  stokRows();
}
function stokRows(){
  const adm=S.user.role==='admin';
  $('stokBody').innerHTML=S.barang.filter(b=>!stokQ||(b.Nama+b.ID).toLowerCase().includes(stokQ)).map(b=>`<tr class="${b.Stok<1?'out':b.Stok<10?'low':''}"><td>${foto(b,1)}</td><td><b>${esc(b.ID)}</b></td><td>${esc(b.Nama)}<br><small class="text-secondary">${esc(b.Kategori)}${b.Status==='Nonaktif'?' · Nonaktif':''}</small></td><td class="text-end">${rp(b.HargaModal)}</td><td class="text-end">${rp(price(b))}</td><td class="text-end">${stokPill(b.Stok)}</td><td>${adm?`<button class="btn btn-sm btn-light" aria-label="Edit ${esc(b.Nama)}" onclick="editBarang('${esc(b.ID)}')"><i class="bi bi-pencil"></i></button> <button class="btn btn-sm btn-light" aria-label="Aktif/nonaktifkan ${esc(b.Nama)}" onclick="togB('${esc(b.ID)}')"><i class="bi bi-${b.Status==='Nonaktif'?'eye':'eye-slash'}"></i></button>`:''}</td></tr>`).join('');
}
function editBarang(id){
  const b=S.barang.find(x=>x.ID===id)||{Status:'Aktif',Kategori:KAT[0]},f=$('fBarang');
  ['ID','Nama','Kategori','HargaModal','HargaJual','HargaDiskon','Stok','Status'].forEach(k=>f.elements[k].value=b[k]!=null?b[k]:(/^Harga|Stok/.test(k)?0:''));
  f.elements.ID.readOnly=!!id;$('fFoto').value='';M('mBarang').show();
}
function readFoto(file){ // kecilkan di klien (maks 640px, JPEG) agar upload ringan
  return new Promise((ok,no)=>{const im=new Image(),fr=new FileReader();
    fr.onload=()=>{im.onload=()=>{const r=Math.min(1,640/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*r);c.height=Math.round(im.height*r);c.getContext('2d').drawImage(im,0,0,c.width,c.height);ok({mime:'image/jpeg',data:c.toDataURL('image/jpeg',0.82).split(',')[1]});};im.onerror=()=>no(new Error('File gambar tidak valid.'));im.src=fr.result;};
    fr.readAsDataURL(file);});
}
async function saveB(e){
  e.preventDefault();const f=e.target,o=Object.fromEntries(new FormData(f)),file=$('fFoto').files[0];
  try{if(file)o.foto=await readFoto(file);}catch(x){return toast(x.message,'danger');}
  call('saveBarang',[S.token,o],()=>{M('mBarang').hide();toast('Barang disimpan','success');refreshBarang(renderStok);},f.querySelector('[type=submit]'));
}
function togB(id){const b=S.barang.find(x=>x.ID===id);call('saveBarang',[S.token,{ID:b.ID,Nama:b.Nama,Kategori:b.Kategori,HargaModal:b.HargaModal,HargaJual:b.HargaJual,HargaDiskon:b.HargaDiskon,Stok:b.Stok,Status:b.Status==='Nonaktif'?'Aktif':'Nonaktif'}],()=>refreshBarang(renderStok));}
function submitMasuk(e){
  e.preventDefault();const f=e.target,v=n=>f.elements[n].value;
  call('addBarangMasuk',[S.token,{id:v('id'),qty:v('qty'),hargaBeli:v('hb'),supplier:v('sup'),exp:v('exp'),bayar:v('bayar'),tempo:v('tempo')}],()=>{toast('Stok bertambah','success');refreshBarang(renderStok);},f.querySelector('button'));
}

/* ── Opname stok (admin) ── */
function renderOpname(){
  $('sec-opname').innerHTML=`<div class="card-x"><h3><i class="bi bi-clipboard-check"></i> Penyesuaian Stok / Opname</h3><p class="small text-secondary">Isi stok fisik hasil hitung. Kosongkan baris yang tidak berubah. Setiap selisih tercatat di riwayat.</p>
  <div class="tbl"><table class="table"><thead><tr><th>Kode</th><th>Barang</th><th class="text-end">Stok Sistem</th><th style="width:150px">Stok Fisik</th></tr></thead><tbody>${S.barang.filter(b=>b.Status!=='Nonaktif').map(b=>`<tr><td><b>${esc(b.ID)}</b></td><td>${esc(b.Nama)}</td><td class="text-end">${b.Stok}</td><td><input type="number" min="0" class="form-control op" data-id="${esc(b.ID)}" aria-label="Stok fisik ${esc(b.Nama)}"></td></tr>`).join('')}</tbody></table></div>
  <div class="d-flex flex-wrap gap-2 mt-3"><select id="opAlasan" class="form-select w-auto" aria-label="Alasan">${opts(['Koreksi hitung','Rusak','Hilang','Kadaluarsa'])}</select><button id="btnOp" class="btn btn-brand" onclick="saveOp()">Simpan Penyesuaian</button></div></div>
  <div class="card-x mt-3"><h3>Riwayat Penyesuaian</h3><div id="logStok" class="tbl"></div></div>`;
  loadLog();
}
function saveOp(){
  const rows=[...document.querySelectorAll('.op')].map(i=>({id:i.dataset.id,fisik:i.value,alasan:$('opAlasan').value}));
  call('saveOpname',[S.token,rows],n=>{toast(n+' barang disesuaikan','success');refreshBarang(renderOpname);},$('btnOp'));
}
function loadLog(){call('getLogStok',[S.token],d=>{$('logStok').innerHTML=d.length?`<table class="table"><thead><tr><th>Waktu</th><th>Oleh</th><th>Barang</th><th class="text-end">Sebelum</th><th class="text-end">Sesudah</th><th>Alasan</th></tr></thead><tbody>${d.map(x=>`<tr><td>${esc(String(x.Tanggal).slice(0,16))}</td><td>${esc(x.User)}</td><td>${esc(x.Barang)}</td><td class="text-end">${x.Sebelum}</td><td class="text-end">${x.Sesudah}</td><td>${esc(x.Alasan)}</td></tr>`).join('')}</tbody></table>`:'<p class="empty">Belum ada penyesuaian</p>';});}

/* ── Invoice / struk ── */
const inv={id:null,mode:'a4'};
function showInv(id,mode){
  inv.id=id;inv.mode=mode||inv.mode;$('invBody').innerHTML='<p class="empty">Memuat…</p>';$('invMail').value=inv.mail||'';M('mInv').show();
  call('getInvoice',[S.token,id,inv.mode],d=>{$('invBody').innerHTML=d.html;});
}
const invMode=m=>showInv(inv.id,m);
function invPdf(b){call('getInvoicePdf',[S.token,inv.id],d=>dlB64(d.b64,d.name,'application/pdf'),b);}
function invSend(b){const v=$('invMail').value.trim();if(!v)return toast('Isi email penerima','warning');call('emailInvoice',[S.token,inv.id,v],()=>toast('Invoice terkirim ke '+v,'success'),b);}

/* ── Pesanan + resi otomatis + notifikasi + pengembalian dana ── */
let resiId=null;
function twoClick(btn,fn){ // konfirmasi 2x klik (tanpa confirm() yang diblokir di iframe)
  if(btn.dataset.sure){fn(btn);return;}
  btn.dataset.sure='1';const t=btn.innerHTML;btn.textContent='Klik lagi untuk konfirmasi';setTimeout(()=>{btn.dataset.sure='';btn.innerHTML=t;},4000);
}
function loadPesanan(){
  const el=$('sec-pesanan'),staff=S.user.role!=='pelanggan';
  el.innerHTML=(staff?`<div class="chips mb-3"><button class="${S.pTab==='order'?'on':''}" onclick="S.pTab='order';loadPesanan()">Pesanan</button><button class="${S.pTab==='refund'?'on':''}" onclick="S.pTab='refund';loadPesanan()">Pengembalian Dana <span id="rfCount"></span></button></div>`:'')+'<div id="pBody"><p class="empty">Memuat…</p></div>';
  if(staff&&S.pTab==='refund')return loadRefund();
  call('getPesanan',[S.token],d=>{
    S.orders=d;const unread=new Set(S.notif.items.filter(x=>x.Baru).map(x=>x.Ref)),baru=d.filter(o=>o.Status==='Baru Masuk').length;
    $('pBody').innerHTML=(staff&&baru?`<div class="card-x mb-3 ins"><b><i class="bi bi-bell-fill"></i> ${baru} pesanan baru menunggu diproses</b></div>`:'')+(d.length?d.map(o=>orderCard(o,staff,unread.has(o.ID)||S.hl===o.ID)).join(''):'<p class="empty">Belum ada pesanan</p>');
    S.hl=null;});
}
function orderCard(o,staff,hl){
  const final=['Selesai','Cancel'].includes(o.Status),kirim=o.Alamat!=='Ambil Sendiri',tot=Number(o.Total)+(Number(o.BiayaKirim)||0),rf=o.Refund;
  const tags=(staff&&o.Status==='Baru Masuk'?'<span class="pill bad">BARU</span>':'')+(hl?'<span class="pill warn"><i class="bi bi-bell-fill"></i> Notif baru</span>':'')+(o.Status==='Selesai'&&o.TglTerima?`<span class="pill ok"><i class="bi bi-check2-circle"></i> Diterima pelanggan ${esc(String(o.TglTerima).slice(0,10))}</span>`:'');
  return `<div class="card-x mb-2 ${hl?'hl':''}"><div class="d-flex flex-wrap gap-2 align-items-center"><b>${esc(o.ID)}</b><span class="pill info">${esc(o.Status)}</span>${tags}<small class="text-secondary">${esc(String(o.Tanggal).slice(0,16))} · ${esc(o.Pelanggan)} · ${esc(o.Metode)}</small><b class="ms-auto">${rp(tot)}</b></div>
  <p class="my-2 small">${JSON.parse(o.Items).map(i=>esc(i.qty+'× '+i.nama)).join(', ')}<br><i class="bi bi-geo-alt"></i> ${esc(o.Alamat)}
  ${o.Resi?`<br><i class="bi bi-upc-scan"></i> No. Resi: <b>${esc(o.Resi)}</b>${o.Kurir?` · Kurir ${esc(o.Kurir)} · Ongkir ${rp(o.BiayaKirim)}`:''}`:''}
  ${o.Status==='Cancel'&&o.AlasanBatal?`<br><i class="bi bi-x-circle"></i> Alasan batal: ${esc(o.AlasanBatal)}`:''}
  ${rf?`<br><i class="bi bi-arrow-return-left"></i> Pengembalian dana: <span class="pill ${rf.Status==='Selesai'?'ok':rf.Status==='Menunggu'?'warn':'info'}">${esc(rf.Status)}</span> ${rp(rf.Jumlah)}${rf.Referensi?` · ref ${esc(rf.Referensi)}`:''}`:''}</p>
  <div class="d-flex flex-wrap gap-2"><button class="btn btn-sm btn-light" onclick="showInv('${o.ID}','a4')"><i class="bi bi-file-earmark-text"></i> Invoice</button>
  ${staff&&!final?`<select class="form-select form-select-sm w-auto" aria-label="Ubah status" onchange="setSt('${o.ID}',this.value)">${ST.map(s=>`<option ${s===o.Status?'selected':''}>${s}</option>`).join('')}</select>`:''}
  ${staff&&!final&&kirim?`<button class="btn btn-sm btn-brand" onclick="openResi('${o.ID}')"><i class="bi bi-truck"></i> Input Resi</button>`:''}
  ${!staff&&['Dikirim','Siap Diambil'].includes(o.Status)?`<button class="btn btn-sm btn-accent" onclick="twoClick(this,b=>terima('${o.ID}',b))"><i class="bi bi-box-seam"></i> Pesanan Diterima</button>`:''}
  ${!staff&&o.Status==='Baru Masuk'?`<button class="btn btn-sm btn-outline-danger" onclick="setSt('${o.ID}','Cancel')">Batalkan Pesanan</button>`:''}</div></div>`;
}
function terima(id,btn){call('setStatusPesanan',[S.token,id,'Selesai'],()=>{toast('Terima kasih! Pesanan ditandai sudah diterima.','success');loadPesanan();pollNotif();},btn);}
function setSt(id,s){
  if(s==='Cancel'){ // batal wajib alasan; bila modal ditutup tanpa simpan, daftar dimuat ulang agar dropdown kembali
    S.askRefresh=true;const o=S.orders.find(x=>x.ID===id),online=o&&['QRIS','Transfer','E-Wallet'].includes(o.Metode);
    return ask('Batalkan Pesanan '+id,'Alasan pembatalan',(v,b)=>call('setStatusPesanan',[S.token,id,'Cancel',v],()=>{S.askRefresh=false;M('mInput').hide();toast('Pesanan dibatalkan'+(online?'. Pengembalian dana dicatat.':'.'),'success');loadPesanan();refreshBarang();pollNotif();},b),'text');
  }
  call('setStatusPesanan',[S.token,id,s],()=>{toast('Status diperbarui','success');loadPesanan();refreshBarang();pollNotif();});
}
function openResi(id){const o=S.orders.find(x=>x.ID===id);resiId=id;$('rResi').value=(o&&o.Resi)||'';$('rBiaya').value=(o&&Number(o.BiayaKirim))||0;M('mResi').show();}
function saveResi(e){e.preventDefault();call('setResi',[S.token,resiId,$('rKurir').value,$('rResi').value.trim(),$('rBiaya').value],()=>{M('mResi').hide();toast('Resi tersimpan, status: Dikirim','success');loadPesanan();pollNotif();},e.target.querySelector('.btn-brand'));}
function loadRefund(){
  call('getRefund',[S.token],d=>{
    const adm=S.user.role==='admin',tunggu=d.filter(x=>x.Status==='Menunggu').length;if($('rfCount'))$('rfCount').textContent=tunggu?'('+tunggu+')':'';
    $('pBody').innerHTML=`<div class="card-x p-0 tbl"><table class="table"><thead><tr><th>Tanggal</th><th>Pesanan</th><th>Pelanggan</th><th>Metode</th><th class="text-end">Jumlah</th><th>Alasan</th><th>Status</th><th></th></tr></thead><tbody>${d.length?d.map(x=>`<tr class="${x.Status==='Menunggu'?'low':''}"><td>${esc(String(x.Tanggal).slice(0,10))}</td><td><b>${esc(x.PesananID)}</b></td><td>${esc(x.Pelanggan)}</td><td>${esc(x.Metode)}</td><td class="text-end">${rp(x.Jumlah)}</td><td>${esc(x.Alasan)}</td><td><span class="pill ${x.Status==='Selesai'?'ok':x.Status==='Menunggu'?'warn':'info'}">${esc(x.Status)}</span>${x.Referensi?`<br><small class="text-secondary">${esc(x.Referensi)}</small>`:''}</td><td>${adm&&x.Status==='Menunggu'?`<button class="btn btn-sm btn-brand mb-1" onclick="refundDone('${x.ID}')">Sudah Dikembalikan</button> <button class="btn btn-sm btn-light" onclick="twoClick(this,b=>refundNo('${x.ID}',b))">Tidak Perlu</button>`:''}</td></tr>`).join(''):'<tr><td colspan="8" class="empty">Belum ada pengembalian dana</td></tr>'}</tbody></table></div><p class="small text-secondary mt-2">Hanya pesanan berpembayaran online (QRIS, Transfer, E-Wallet) yang dibatalkan masuk ke sini. Transfer dana dilakukan manual oleh admin, lalu catat nomor referensinya. Pilih "Tidak Perlu" bila pelanggan belum membayar.</p>`;
  });
}
function refundDone(id){ask('Pengembalian Dana','No. referensi transfer / catatan',(v,b)=>call('processRefund',[S.token,id,'selesai',v],()=>{M('mInput').hide();toast('Pengembalian dana dicatat','success');loadRefund();pollNotif();},b),'text');}
function refundNo(id,b){call('processRefund',[S.token,id,'tidak',''],()=>{toast('Ditandai: tidak perlu pengembalian','success');loadRefund();pollNotif();},b);}

/* ── Riwayat transaksi ── */
function loadRiwayat(){
  const el=$('sec-riwayat');el.innerHTML='<p class="empty">Memuat…</p>';
  call('getRiwayat',[S.token],d=>{el.innerHTML=`<div class="card-x p-0 tbl"><table class="table"><thead><tr><th>Waktu</th><th>No.</th><th>Pelanggan</th><th class="text-end">Total</th><th>Metode</th><th>Sumber</th><th></th></tr></thead><tbody>${d.length?d.map(x=>`<tr><td>${esc(String(x.Tanggal).slice(0,16))}</td><td><b>${esc(x.ID)}</b></td><td>${esc(x.Pelanggan)}</td><td class="text-end">${rp(x.Total)}</td><td>${esc(x.Metode)}</td><td>${esc(x.Sumber)}</td><td><button class="btn btn-sm btn-light" aria-label="Lihat invoice ${esc(x.ID)}" onclick="showInv('${x.ID}','struk')"><i class="bi bi-printer"></i></button></td></tr>`).join(''):'<tr><td colspan="7" class="empty">Belum ada transaksi</td></tr>'}</tbody></table></div>`;});
}

/* ── Laporan (admin) ── */
const LP={jenis:'penjualan',dari:'',sampai:''};
const JENIS=[['penjualan','Penjualan & Trend Kategori'],['labarugi','Laba-Rugi'],['stok','Stok'],['piutang','Piutang Pelanggan'],['hutang','Hutang Supplier'],['biaya','Biaya Operasional']];
function renderLaporan(){
  const t=new Date(),p=n=>String(n).padStart(2,'0'),today=`${t.getFullYear()}-${p(t.getMonth()+1)}-${p(t.getDate())}`;
  LP.dari=LP.dari||today.slice(0,8)+'01';LP.sampai=LP.sampai||today;
  $('sec-laporan').innerHTML=`<div class="card-x mb-3 d-flex flex-wrap gap-2 align-items-end"><div><label for="lpJ">Laporan</label><select id="lpJ" class="form-select" onchange="LP.jenis=this.value;loadLap()">${JENIS.map(j=>`<option value="${j[0]}" ${j[0]===LP.jenis?'selected':''}>${j[1]}</option>`).join('')}</select></div>
  <div><label for="lpA">Dari</label><input id="lpA" type="date" class="form-control" value="${LP.dari}"></div><div><label for="lpB">Sampai</label><input id="lpB" type="date" class="form-control" value="${LP.sampai}"></div>
  <button class="btn btn-brand" onclick="loadLap()">Tampilkan</button><button class="btn btn-light" onclick="expLap(this)"><i class="bi bi-file-earmark-excel"></i> Export Excel</button></div><div id="lpOut"></div>`;
  loadLap();
}
function lapRange(){LP.dari=$('lpA').value;LP.sampai=$('lpB').value;return [S.token,LP.jenis,LP.dari,LP.sampai];}
function tblHtml(tb){
  const m=tb.money||[];
  return `<div class="card-x mb-3"><h3>${esc(tb.title)}</h3><div class="tbl"><table class="table"><thead><tr>${tb.cols.map(c=>`<th>${esc(c)}</th>`).join('')}${tb.act?'<th></th>':''}</tr></thead><tbody>${tb.rows.length?tb.rows.map((r,i)=>`<tr>${r.map((v,j)=>`<td class="${m.includes(j)?'text-end':''}">${m.includes(j)?rp(v):esc(v)}</td>`).join('')}${tb.act?`<td>${tb.act==='biaya'?`<button class="btn btn-sm btn-light text-danger" aria-label="Hapus biaya" onclick="delBiaya('${tb.ids[i]}')"><i class="bi bi-trash"></i></button>`:`<button class="btn btn-sm btn-brand" onclick="bayar('${tb.act}','${tb.ids[i]}')">Bayar</button>`}</td>`:''}</tr>`).join(''):`<tr><td colspan="${tb.cols.length+1}" class="empty">Tidak ada data</td></tr>`}</tbody></table></div></div>`;
}
function loadLap(){
  const out=$('lpOut');out.innerHTML='<p class="empty">Memuat laporan…</p>';
  call('getLaporan',lapRange(),d=>{
    const form=LP.jenis==='biaya'?`<form class="card-x mb-3 row g-2 align-items-end" onsubmit="addBiaya(event)"><div class="col-6 col-md-2"><label>Tanggal</label><input name="Tanggal" type="date" class="form-control" value="${LP.sampai}" required></div><div class="col-6 col-md-2"><label>Kategori</label><select name="Kategori" class="form-select">${opts(BKAT)}</select></div><div class="col-12 col-md-4"><label>Deskripsi</label><input name="Deskripsi" class="form-control"></div><div class="col-6 col-md-2"><label>Jumlah (Rp)</label><input name="Jumlah" type="number" min="1" class="form-control" required></div><div class="col-6 col-md-2"><button class="btn btn-brand w-100">Catat Biaya</button></div></form>`:'';
    out.innerHTML=form+`<div class="row g-3 mb-3">${d.sum.map(s=>`<div class="col-6 col-xl-3"><div class="card-x kpi"><small>${esc(s[0])}</small><b>${s[2]?esc(s[1]):rp(s[1])}</b></div></div>`).join('')}</div>`+d.tables.map(tblHtml).join('');
  });
}
function expLap(b){call('exportExcel',lapRange(),d=>{dlB64(d.b64,d.name,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');toast('Excel diunduh: '+d.name,'success');},b);}
function addBiaya(e){e.preventDefault();call('addBiaya',[S.token,Object.fromEntries(new FormData(e.target))],()=>{toast('Biaya dicatat','success');loadLap();},e.target.querySelector('button'));}
function delBiaya(id){call('delBiaya',[S.token,id],()=>{toast('Biaya dihapus','success');loadLap();});}
function bayar(jenis,id){
  ask(jenis==='piutang'?'Terima Pembayaran Piutang':'Bayar Hutang Supplier','Nominal (Rp)',(v,b)=>call(jenis==='piutang'?'bayarPiutang':'bayarHutang',[S.token,id,v],()=>{M('mInput').hide();toast('Pembayaran dicatat','success');loadLap();},b));
}

/* ── Kelola pengguna (admin) ── */
let USERS=[];
function loadUsers(){
  const el=$('sec-karyawan');el.innerHTML='<p class="empty">Memuat…</p>';
  call('listUsers',[S.token],d=>{USERS=d;el.innerHTML=`<div class="d-flex mb-3"><button class="btn btn-brand" onclick="editUser()"><i class="bi bi-person-plus"></i> Tambah Pengguna</button></div><div class="card-x p-0 tbl"><table class="table"><thead><tr><th>Username</th><th>Nama</th><th>Role</th><th>Email</th><th>Status</th><th></th></tr></thead><tbody>${d.map(u=>`<tr><td><b>${esc(u.Username)}</b></td><td>${esc(u.Nama)}</td><td><span class="pill info">${esc(u.Role)}</span></td><td>${esc(u.Email)}</td><td><span class="pill ${u.Status==='Nonaktif'?'bad':'ok'}">${esc(u.Status)}</span></td><td><button class="btn btn-sm btn-light" aria-label="Edit ${esc(u.Username)}" onclick="editUser('${esc(u.ID)}')"><i class="bi bi-pencil"></i></button></td></tr>`).join('')}</tbody></table></div>`;});
}
function editUser(id){
  const u=USERS.find(x=>x.ID===id)||{Role:'karyawan',Status:'Aktif'},f=$('fUser');
  ['ID','Username','Nama','Email','Role','Status'].forEach(k=>f.elements[k].value=u[k]||'');
  f.elements.Username.readOnly=!!id;f.elements.Password.value='';f.elements.Password.required=!id;
  $('pwLbl').textContent=id?'Reset sandi (kosongkan jika tidak diubah)':'Sandi awal (min. 8) *';$('mUserTtl').textContent=id?'Edit Pengguna':'Pengguna Baru';M('mUser').show();
}
function saveU(e){e.preventDefault();call('saveUser',[S.token,Object.fromEntries(new FormData(e.target))],()=>{M('mUser').hide();toast('Pengguna disimpan','success');loadUsers();},e.target.querySelector('.btn-brand'));}

/* ── Pengaturan (semua peran: ubah sandi; admin: profil toko, backup) ── */
function renderPengaturan(){
  const adm=S.user.role==='admin';
  $('sec-pengaturan').innerHTML=`<div class="row g-3"><div class="col-lg-5"><form class="card-x" onsubmit="chPw(event)"><h3><i class="bi bi-key"></i> Ubah Kata Sandi</h3>
  <label for="pw0">Sandi Lama</label><input id="pw0" type="password" class="form-control" required autocomplete="current-password">
  <label for="pw1">Sandi Baru (min. 8)</label><input id="pw1" type="password" minlength="8" class="form-control" required autocomplete="new-password">
  <label for="pw2">Ulangi Sandi Baru</label><input id="pw2" type="password" minlength="8" class="form-control" required autocomplete="new-password">
  <button class="btn btn-brand mt-3">Perbarui Sandi</button></form></div>${adm?'<div class="col-lg-7" id="tokoBox"><p class="empty">Memuat…</p></div>':''}</div>`;
  if(adm)call('getPengaturan',[S.token],c=>{$('tokoBox').innerHTML=`<form class="card-x" onsubmit="saveToko(event)"><h3><i class="bi bi-shop"></i> Profil Toko &amp; Notifikasi</h3>
  <label>Nama Toko</label><input name="namaToko" class="form-control" value="${esc(c.namaToko)}" required>
  <label>Alamat</label><input name="alamat" class="form-control" value="${esc(c.alamat)}"><label>Telepon</label><input name="telepon" class="form-control" value="${esc(c.telepon)}">
  <label>Email Admin (terima notifikasi pesanan baru)</label><input name="emailAdmin" type="email" class="form-control" value="${esc(c.emailAdmin)}">
  <label>Notifikasi Email</label><select name="notifEmail" class="form-select"><option value="on" ${c.notifEmail!=='off'?'selected':''}>Aktif</option><option value="off" ${c.notifEmail==='off'?'selected':''}>Nonaktif</option></select>
  <div class="d-flex flex-wrap gap-2 mt-3"><button class="btn btn-brand">Simpan Pengaturan</button><button type="button" class="btn btn-light" onclick="doBackup(this)"><i class="bi bi-cloud-arrow-up"></i> Backup ke Drive</button></div></form>${logoCard(c)}`;});
}
function chPw(e){
  e.preventDefault();if($('pw1').value!==$('pw2').value)return toast('Konfirmasi sandi tidak sama','warning');
  call('changePassword',[S.token,$('pw0').value,$('pw1').value],()=>{toast('Sandi diperbarui','success');e.target.reset();},e.target.querySelector('button'));
}
function saveToko(e){e.preventDefault();call('savePengaturan',[S.token,Object.fromEntries(new FormData(e.target))],()=>toast('Pengaturan disimpan','success'),e.target.querySelector('.btn-brand'));}
function doBackup(b){call('backupNow',[S.token],()=>toast('Backup dibuat di Google Drive','success'),b);}

/* ── Dashboard ── */
function loadDash(){
  const el=$('sec-dashboard');el.innerHTML='<p class="empty">Memuat dashboard…</p>';
  call('getDashboard',[S.token],d=>{
    el.innerHTML=`<div class="row g-3 mb-3">${[['Omzet Hari Ini',rp(d.omzet),'cash-coin'],['Transaksi',d.trx,'receipt'],['Laba Hari Ini',rp(d.laba),'graph-up-arrow'],['Piutang',rp(d.piutang),'person-lines-fill'],['Hutang Supplier',rp(d.hutang),'building'],['Pesanan Baru',d.pesananBaru,'bell']].map(k=>`<div class="col-6 col-xl-2"><div class="card-x kpi"><i class="bi bi-${k[2]}"></i><small>${k[0]}</small><b>${k[1]}</b></div></div>`).join('')}</div>
    <div class="row g-3"><div class="col-lg-8"><div class="card-x"><h3>Trend Penjualan 7 Hari</h3><canvas id="c1" height="130"></canvas></div></div><div class="col-lg-4"><div class="card-x"><h3>Penjualan per Kategori</h3><canvas id="c2"></canvas></div></div>
    <div class="col-lg-6"><div class="card-x ins h-100"><h3><i class="bi bi-stars"></i> Analisis Otomatis</h3><ul class="mb-0">${d.insights.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></div></div>
    <div class="col-lg-6"><div class="card-x h-100"><h3>Peringatan Stok</h3>${d.low.length?d.low.map(x=>`<div class="line"><div class="grow"><b>${esc(x.nama)}</b><small>${esc(x.id)}</small></div>${stokPill(x.stok)}</div>`).join(''):'<p class="empty">Semua stok aman</p>'}</div></div></div>`;
    S.ch.forEach(c=>c.destroy());Chart.defaults.color=getComputedStyle(document.documentElement).getPropertyValue('--mut');Chart.defaults.font.family="'Plus Jakarta Sans',sans-serif";
    S.ch=[new Chart($('c1'),{type:'bar',data:{labels:d.days,datasets:[{data:d.trend,backgroundColor:'#00AEEF',borderRadius:6}]},options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{callback:v=>rp(v)}}}}}),
      new Chart($('c2'),{type:'doughnut',data:{labels:Object.keys(d.kat),datasets:[{data:Object.values(d.kat),backgroundColor:['#123088','#00AEEF','#FFD000','#059669','#FF5900','#7C3AED','#64748B'],borderWidth:0}]},options:{plugins:{legend:{position:'bottom'}}}})];
  });
}

/* ── Notifikasi in-app (lonceng + badge menu Pesanan) ── */
S.notif={unread:0,items:[]};S.pTab='order';S.hl=null;S.askRefresh=false;S.orders=[];let pollT=null;
const nIcon={order_baru:'bag-plus',diterima:'box-seam',batal:'x-octagon',refund:'arrow-return-left',status:'truck'};
function startPoll(){S.notif={unread:0,items:[]};paintNotif();pollNotif(true);clearInterval(pollT);pollT=setInterval(()=>pollNotif(),45000);}
function stopPoll(){clearInterval(pollT);pollT=null;$('notifPanel').classList.add('d-none');}
function pollNotif(first){
  if(!S.token||document.hidden)return;
  api('getNotif',[S.token]).then(r=>{
    if(!r.success){if(/^Sesi berakhir/.test(r.message))fail(r.message);return;}
    const prev=S.notif.unread;S.notif=r.data;paintNotif();
    if(!first&&r.data.unread>prev){const n=r.data.items.find(x=>x.Baru);if(n)toast(n.Pesan,'warning');if($('sec-pesanan').classList.contains('on'))loadPesanan();}
  }).catch(()=>{});
}
function paintNotif(){
  const n=S.notif.unread,t=n>99?'99+':n;
  ['bellBadge','navBadge'].forEach(id=>{const e=$(id);if(e){e.textContent=t;e.classList.toggle('d-none',!n);}});
  $('notifPanel').innerHTML=`<div class="d-flex align-items-center p-2 border-bottom"><b class="ms-2">Notifikasi</b><button class="btn btn-sm ms-auto" onclick="markAllNotif()" ${n?'':'disabled'}>Tandai semua dibaca</button></div>`+(S.notif.items.length?S.notif.items.map(x=>`<div class="it ${x.Baru?'new':''}" role="button" tabindex="0" onclick="notifClick('${x.ID}')" onkeydown="if(event.key==='Enter')notifClick('${x.ID}')"><i class="bi bi-${nIcon[x.Tipe]||'bell'}"></i> ${esc(x.Pesan)}<small class="d-block text-secondary">${esc(String(x.Tanggal).slice(0,16))}</small></div>`).join(''):'<p class="empty">Belum ada notifikasi</p>');
}
function toggleNotif(){$('notifPanel').classList.toggle('d-none');}
function notifClick(id){
  const x=S.notif.items.find(i=>i.ID===id);if(!x)return;S.hl=x.Ref;
  if(x.Baru){x.Baru=false;S.notif.unread=Math.max(0,S.notif.unread-1);paintNotif();call('markNotif',[S.token,[id]],()=>{});}
  $('notifPanel').classList.add('d-none');S.pTab=(x.Tipe==='refund'&&S.user.role!=='pelanggan')?'refund':'order';go('pesanan');
}
function markAllNotif(){S.notif.items.forEach(i=>{i.Baru=false;});S.notif.unread=0;paintNotif();call('markNotif',[S.token,'all'],()=>{});}

/* ── Logo toko (unggah manual di Pengaturan) ── */
const BRAND_DEF='<span class="logo"><i class="bi bi-lightning-charge-fill"></i></span><div><b>E-Warungku</b><small>PROMO &amp; RETAIL</small></div>';
S.logo='';S.logoLocal='';
const logoUrl=id=>'https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w600';
function applyLogo(id){ // ganti seluruh blok merek (login + menu samping); gambar gagal dimuat → kembali ke logo bawaan
  S.logo=id||'';const src=S.logoLocal||(id?logoUrl(id):'');
  document.querySelectorAll('.brand').forEach(b=>{b.innerHTML=src?`<img referrerpolicy="no-referrer" class="brand-img" src="${src}" alt="Logo toko" onerror="this.outerHTML=BRAND_DEF">`:BRAND_DEF;});
}
function readLogo(file){ // kecilkan maks 480px; PNG/WebP tetap PNG agar latar transparan terjaga
  return new Promise((ok,no)=>{const im=new Image(),fr=new FileReader();
    fr.onload=()=>{im.onload=()=>{const r=Math.min(1,480/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*r));c.height=Math.max(1,Math.round(im.height*r));c.getContext('2d').drawImage(im,0,0,c.width,c.height);
      const mime=file.type==='image/jpeg'?'image/jpeg':'image/png',url=c.toDataURL(mime,0.92);ok({mime,data:url.split(',')[1],url});};im.onerror=()=>no(new Error('File gambar tidak valid.'));im.src=fr.result;};
    fr.readAsDataURL(file);});
}
function logoCard(c){
  const cur=S.logoLocal||(c.logoId?logoUrl(c.logoId):'');
  return `<div class="card-x mt-3"><h3><i class="bi bi-image"></i> Logo Toko</h3>
  <div class="logo-prev mb-2" id="logoPrev">${cur?`<img referrerpolicy="no-referrer" class="brand-img" src="${cur}" alt="Logo saat ini">`:'<span class="text-secondary small">Belum ada logo khusus — memakai logo bawaan.</span>'}</div>
  <label for="logoFile">Pilih gambar logo (PNG / JPG / WebP)</label><input id="logoFile" type="file" accept="image/png,image/jpeg,image/webp" class="form-control" onchange="prevLogo(this)">
  <small class="text-secondary d-block mt-1">Disarankan PNG berlatar transparan. Gambar otomatis dikecilkan (maks 480 px). Logo tampil di halaman login, menu samping, serta invoice &amp; struk. Bila logo berisi nama toko, nama tidak diulang di invoice.</small>
  <div class="d-flex flex-wrap gap-2 mt-3"><button class="btn btn-brand" onclick="saveLogoBtn(this)"><i class="bi bi-cloud-upload"></i> Simpan Logo</button><button class="btn btn-light text-danger" onclick="delLogo(this)" ${c.logoId?'':'disabled'}>Hapus Logo</button></div></div>`;
}
function prevLogo(inp){const f=inp.files[0];if(f)$('logoPrev').innerHTML=`<img referrerpolicy="no-referrer" class="brand-img" src="${URL.createObjectURL(f)}" alt="Pratinjau logo baru">`;}
function saveLogoBtn(btn){
  const f=$('logoFile').files[0];if(!f)return toast('Pilih gambar logo dulu','warning');
  readLogo(f).then(x=>call('saveLogo',[S.token,{mime:x.mime,data:x.data}],d=>{S.logoLocal=x.url;applyLogo(d.logoId);toast('Logo disimpan','success');renderPengaturan();},btn)).catch(e=>toast(e.message,'danger'));
}
function delLogo(btn){call('hapusLogo',[S.token],()=>{S.logoLocal='';applyLogo('');toast('Logo dihapus, kembali ke bawaan','success');renderPengaturan();},btn);}

/* ── Beban Operasional (lembar admin: listrik, air, internet, dll.) ── */
const BCOL={Listrik:'#FFD000',Air:'#00AEEF',Internet:'#123088',Sewa:'#059669',Gaji:'#FF5900',Maintenance:'#7C3AED',Lainnya:'#64748B'};
const BB={bulan:'',chart:null};
const curMonth=()=>{const t=new Date();return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0');};
function renderBeban(){
  BB.bulan=BB.bulan||curMonth();
  $('sec-beban').innerHTML=`<div class="card-x mb-3 d-flex flex-wrap gap-2 align-items-end"><div><label for="bbBulan">Bulan</label><input id="bbBulan" type="month" class="form-control" value="${BB.bulan}" onchange="BB.bulan=this.value;loadBeban()"></div>
  <button class="btn btn-light" onclick="expBeban(this)"><i class="bi bi-file-earmark-excel"></i> Export Excel</button>
  <small class="text-secondary ms-auto">Data yang sama dipakai di Laporan &amp; Laba-Rugi.</small></div><div id="bbOut"><p class="empty">Memuat…</p></div>`;
  loadBeban();
}
function loadBeban(){
  if(!/^\d{4}-\d{2}$/.test(BB.bulan))return toast('Pilih bulan yang valid','warning');
  call('getBebanOps',[S.token,BB.bulan],d=>{
    const sum=o=>Object.values(o).reduce((a,b)=>a+Number(b),0),tot=sum(d.now),totP=sum(d.prev);
    const delta=(a,b)=>{if(!a&&!b)return '<small class="text-secondary">—</small>';if(!b)return '<small class="text-secondary">Baru bulan ini</small>';const p=Math.round((a-b)/b*100);return `<small style="color:var(--${p>0?'bad':'ok'});font-weight:700">${p>0?'▲':p<0?'▼':'■'} ${Math.abs(p)}% vs bulan lalu</small>`;};
    const card=(l,a,b,ic)=>`<div class="col-6 col-xl-3"><div class="card-x kpi"><i class="bi bi-${ic}"></i><small>${l}</small><b>${rp(a)}</b>${delta(a,b)}</div></div>`;
    const t=new Date(),pad=n=>String(n).padStart(2,'0'),defDate=BB.bulan===curMonth()?`${t.getFullYear()}-${pad(t.getMonth()+1)}-${pad(t.getDate())}`:BB.bulan+'-01';
    $('bbOut').innerHTML=`<div class="row g-3 mb-3">${card('Listrik',d.now.Listrik,d.prev.Listrik,'lightning-charge')}${card('Air',d.now.Air,d.prev.Air,'droplet')}${card('Internet',d.now.Internet,d.prev.Internet,'wifi')}${card('Total Beban Bulan Ini',tot,totP,'wallet2')}</div>
    <form class="card-x mb-3 row g-2 align-items-end" onsubmit="addBeban(event)"><div class="col-6 col-md-2"><label>Tanggal</label><input name="Tanggal" type="date" class="form-control" value="${defDate}" required></div>
    <div class="col-6 col-md-2"><label>Jenis Beban</label><select name="Kategori" class="form-select">${opts(BKAT)}</select></div>
    <div class="col-12 col-md-4"><label>Keterangan</label><input name="Deskripsi" class="form-control" placeholder="mis. Token PLN / tagihan PDAM / WiFi bulanan"></div>
    <div class="col-6 col-md-2"><label>Jumlah (Rp)</label><input name="Jumlah" type="number" min="1" class="form-control" required></div>
    <div class="col-6 col-md-2"><button class="btn btn-brand w-100"><i class="bi bi-plus-lg"></i> Catat</button></div></form>
    <div class="card-x mb-3"><h3>Tren Beban 6 Bulan Terakhir</h3><canvas id="bbChart" height="110"></canvas></div>
    <div class="card-x p-0 tbl"><table class="table"><thead><tr><th>Tanggal</th><th>Jenis</th><th>Keterangan</th><th class="text-end">Jumlah</th><th></th></tr></thead><tbody>${d.rows.length?d.rows.map(r=>`<tr><td>${esc(r.Tanggal)}</td><td><span class="pill" style="background:${BCOL[r.Kategori]||'#64748B'}33;color:var(--tx)">${esc(r.Kategori)}</span></td><td>${esc(r.Deskripsi)}</td><td class="text-end">${rp(r.Jumlah)}</td><td><button class="btn btn-sm btn-light text-danger" aria-label="Hapus beban ${esc(r.Kategori)} ${esc(r.Tanggal)}" onclick="delBeban('${r.ID}')"><i class="bi bi-trash"></i></button></td></tr>`).join(''):'<tr><td colspan="5" class="empty">Belum ada beban tercatat pada bulan ini</td></tr>'}</tbody><tfoot><tr><th colspan="3">Total bulan ini</th><th class="text-end">${rp(tot)}</th><th></th></tr></tfoot></table></div>`;
    if(BB.chart)BB.chart.destroy();Chart.defaults.color=getComputedStyle(document.documentElement).getPropertyValue('--mut');Chart.defaults.font.family="'Plus Jakarta Sans',sans-serif";
    BB.chart=new Chart($('bbChart'),{type:'bar',data:{labels:d.months.map(m=>m.slice(5)+'/'+m.slice(2,4)),datasets:d.kategori.map(k=>({label:k,data:d.trend.map(x=>x[k]||0),backgroundColor:BCOL[k]||'#64748B'}))},options:{plugins:{legend:{position:'bottom'}},scales:{x:{stacked:true},y:{stacked:true,beginAtZero:true,ticks:{callback:v=>rp(v)}}}}});
  });
}
function addBeban(e){
  e.preventDefault();const o=Object.fromEntries(new FormData(e.target));
  call('addBiaya',[S.token,o],()=>{toast('Beban dicatat','success');BB.bulan=o.Tanggal.slice(0,7);$('bbBulan').value=BB.bulan;loadBeban();},e.target.querySelector('button'));
}
function delBeban(id){call('delBiaya',[S.token,id],()=>{toast('Beban dihapus','success');loadBeban();});}
function expBeban(b){
  const a=BB.bulan.split('-').map(Number),last=new Date(a[0],a[1],0).getDate();
  call('exportExcel',[S.token,'biaya',BB.bulan+'-01',BB.bulan+'-'+String(last).padStart(2,'0')],d=>{dlB64(d.b64,d.name,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');toast('Excel diunduh: '+d.name,'success');},b);
}

/* ── Inisialisasi: konfigurasi, branding, pulihkan sesi ── */
async function loadBranding(){ // GET publik: nama toko + logo untuk halaman login
  try{const r=await(await fetch(GAS_URL+'?action=getBranding')).json();
    if(r.success){applyLogo(r.data.logoId);if(r.data.namaToko)document.title=r.data.namaToko;try{localStorage.setItem('ew_logo',r.data.logoId||'')}catch(e){}}}catch(e){}
}
async function initSession(){
  try{applyLogo(localStorage.getItem('ew_logo')||'');}catch(e){} // logo terakhir tampil instan
  if(!configOk()){$('boot').remove();$('authView').classList.remove('d-none');$('cfgWarn').classList.remove('d-none');return;}
  loadBranding();
  let sv=null;try{sv=JSON.parse(sessionStorage.getItem('ew_sess')||'null')}catch(e){}
  if(sv&&sv.token){ // validasi token lama ke server; valid → langsung masuk (refresh tidak logout)
    try{const r=await api('getNotif',[sv.token]);if(r.success){S.token=sv.token;S.user=sv.user;$('boot').remove();enter();return;}}catch(e){}
    try{sessionStorage.removeItem('ew_sess')}catch(e){}
  }
  $('boot').remove();$('authView').classList.remove('d-none');
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded',()=>{
  try{document.documentElement.dataset.theme=localStorage.getItem('ew_theme')||'light'}catch(e){}
  initSession();
  $('mInput').addEventListener('hidden.bs.modal',()=>{if(S.askRefresh){S.askRefresh=false;loadPesanan();}});
  document.addEventListener('click',e=>{const p=$('notifPanel');if(!p.classList.contains('d-none')&&!e.target.closest('#notifPanel')&&!e.target.closest('#bell'))p.classList.add('d-none');});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)pollNotif();});
});
