Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$outputRoot = Join-Path $PSScriptRoot "deliverables"
New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null

$brand = @{
  Deep = "075D4E"; Primary = "047857"; Bright = "10B981"; Mint = "DFF7EB";
  Soft = "F3FBF7"; Ink = "10233E"; Text = "334155"; Muted = "64748B";
  Line = "B7E4D1"; Amber = "B7791F"; AmberSoft = "FFF5D6"; Sky = "0369A1";
  SkySoft = "E0F2FE"; Violet = "6D28D9"; VioletSoft = "F3E8FF"; Rose = "BE123C";
  RoseSoft = "FFF1F2"; SlateSoft = "F1F5F9"; White = "FFFFFF";
}

function Xml([string]$value) {
  return [System.Security.SecurityElement]::Escape($value)
}

function Twips([double]$inches) { return [int][math]::Round($inches * 1440) }

function New-Run([string]$Text, [double]$Size = 10.5, [string]$Color = $brand.Text, [bool]$Bold = $false, [bool]$Italic = $false) {
  return [pscustomobject]@{ Text = $Text; Size = $Size; Color = $Color; Bold = $Bold; Italic = $Italic }
}

function New-Line([string]$Text, [double]$Size = 10.5, [string]$Color = $brand.Text, [bool]$Bold = $false, [string]$Align = "left") {
  return [pscustomobject]@{ Text = $Text; Size = $Size; Color = $Color; Bold = $Bold; Italic = $false; Align = $Align }
}

function RunXml($Run) {
  $halfPoints = [int][math]::Round($Run.Size * 2)
  $boldXml = if ($Run.Bold) { "<w:b/>" } else { "" }
  $italicXml = if ($Run.Italic) { "<w:i/>" } else { "" }
  return "<w:r><w:rPr><w:rFonts w:ascii=`"Arial`" w:hAnsi=`"Arial`"/><w:color w:val=`"$($Run.Color)`"/><w:sz w:val=`"$halfPoints`"/><w:szCs w:val=`"$halfPoints`"/>$boldXml$italicXml</w:rPr><w:t xml:space=`"preserve`">$(Xml $Run.Text)</w:t></w:r>"
}

function ParagraphXml(
  [object[]]$Runs,
  [string]$Style = "Normal",
  [string]$Align = "left",
  [int]$Before = 0,
  [int]$After = 120,
  [bool]$PageBreakBefore = $false,
  [int]$Numbering = 0,
  [bool]$KeepNext = $false
) {
  $alignXml = switch ($Align) { "center" { "<w:jc w:val=`"center`"/>" } "right" { "<w:jc w:val=`"right`"/>" } default { "<w:jc w:val=`"left`"/>" } }
  $breakXml = if ($PageBreakBefore) { "<w:pageBreakBefore/>" } else { "" }
  $keepXml = if ($KeepNext) { "<w:keepNext/>" } else { "" }
  $numberingXml = if ($Numbering -gt 0) { "<w:numPr><w:ilvl w:val=`"0`"/><w:numId w:val=`"$Numbering`"/></w:numPr>" } else { "" }
  $content = ($Runs | ForEach-Object { RunXml $_ }) -join ""
  return "<w:p><w:pPr><w:pStyle w:val=`"$Style`"/><w:spacing w:before=`"$Before`" w:after=`"$After`" w:line=`"280`" w:lineRule=`"auto`"/>$alignXml$breakXml$keepXml$numberingXml</w:pPr>$content</w:p>"
}

function BreakXml() { return "<w:p><w:r><w:br w:type=`"page`"/></w:r></w:p>" }

function New-Cell(
  [object[]]$Lines,
  [string]$Fill = $brand.White,
  [string]$Border = $brand.Line,
  [string]$Align = "left",
  [string]$VAlign = "center"
) {
  return [pscustomobject]@{ Lines = $Lines; Fill = $Fill; Border = $Border; Align = $Align; VAlign = $VAlign }
}

function CellXml($Cell, [int]$Width) {
  $lineXml = foreach ($line in $Cell.Lines) {
    ParagraphXml -Runs @((New-Run $line.Text $line.Size $line.Color $line.Bold $line.Italic)) -Align $line.Align -Before 0 -After 80
  }
  $vAlign = if ($Cell.VAlign -eq "top") { "top" } else { "center" }
  return "<w:tc><w:tcPr><w:tcW w:w=`"$Width`" w:type=`"dxa`"/><w:shd w:val=`"clear`" w:color=`"auto`" w:fill=`"$($Cell.Fill)`"/><w:tcMar><w:top w:w=`"110`" w:type=`"dxa`"/><w:start w:w=`"150`" w:type=`"dxa`"/><w:bottom w:w=`"110`" w:type=`"dxa`"/><w:end w:w=`"150`" w:type=`"dxa`"/></w:tcMar><w:vAlign w:val=`"$vAlign`"/></w:tcPr>$($lineXml -join [string]::Empty)</w:tc>"
}

function TableXml([object[]]$Rows, [int[]]$Widths, [string]$OuterBorder = $brand.Line) {
  $grid = ($Widths | ForEach-Object { "<w:gridCol w:w=`"$_`"/>" }) -join ""
  $rowXml = foreach ($row in $Rows) {
    $rowCells = [System.Collections.ArrayList]::new()
    if (($row -is [System.Collections.IEnumerable]) -and -not ($row -is [string])) {
      foreach ($item in $row) { [void]$rowCells.Add($item) }
    } else {
      [void]$rowCells.Add($row)
    }
    $cells = for ($index = 0; $index -lt $rowCells.Count; $index++) { CellXml $rowCells[$index] $Widths[$index] }
    "<w:tr><w:trPr><w:cantSplit/><w:trHeight w:val=`"480`" w:hRule=`"atLeast`"/></w:trPr>$($cells -join [string]::Empty)</w:tr>"
  }
  return "<w:tbl><w:tblPr><w:tblW w:w=`"9360`" w:type=`"dxa`"/><w:tblInd w:w=`"120`" w:type=`"dxa`"/><w:tblLayout w:type=`"fixed`"/><w:tblCellSpacing w:w=`"0`" w:type=`"dxa`"/><w:tblBorders><w:top w:val=`"single`" w:sz=`"8`" w:space=`"0`" w:color=`"$OuterBorder`"/><w:left w:val=`"single`" w:sz=`"8`" w:space=`"0`" w:color=`"$OuterBorder`"/><w:bottom w:val=`"single`" w:sz=`"8`" w:space=`"0`" w:color=`"$OuterBorder`"/><w:right w:val=`"single`" w:sz=`"8`" w:space=`"0`" w:color=`"$OuterBorder`"/><w:insideH w:val=`"single`" w:sz=`"4`" w:space=`"0`" w:color=`"$OuterBorder`"/><w:insideV w:val=`"single`" w:sz=`"4`" w:space=`"0`" w:color=`"$OuterBorder`"/></w:tblBorders></w:tblPr><w:tblGrid>$grid</w:tblGrid>$($rowXml -join [string]::Empty)</w:tbl>"
}

function Add-Paragraph($Builder, [string]$Text, [double]$Size = 10.5, [string]$Color = $brand.Text, [bool]$Bold = $false, [string]$Style = "Normal", [string]$Align = "left", [int]$Before = 0, [int]$After = 120, [bool]$PageBreakBefore = $false) {
  [void]$Builder.Append((ParagraphXml -Runs @((New-Run $Text $Size $Color $Bold)) -Style $Style -Align $Align -Before $Before -After $After -PageBreakBefore $PageBreakBefore))
}

function Add-Heading($Builder, [string]$Text, [int]$Level = 1) {
  $style = if ($Level -eq 1) { "Heading1" } elseif ($Level -eq 2) { "Heading2" } else { "Heading3" }
  $size = if ($Level -eq 1) { 16 } elseif ($Level -eq 2) { 13 } else { 11.5 }
  $color = if ($Level -eq 3) { $brand.Deep } else { $brand.Primary }
  [void]$Builder.Append((ParagraphXml -Runs @((New-Run $Text $size $color $true)) -Style $style -Before 260 -After 120 -KeepNext $true))
}

function Add-Kicker($Builder, [string]$Text) {
  Add-Paragraph $Builder $Text.ToUpperInvariant() 8.5 $brand.Bright $true "Normal" "left" 40 80
}

function Add-Bullets($Builder, [string[]]$Items) {
  foreach ($item in $Items) {
    [void]$Builder.Append((ParagraphXml -Runs @((New-Run $item 10.5 $brand.Text $false)) -Style "Normal" -Before 0 -After 70 -Numbering 1))
  }
}

function Add-Numbers($Builder, [string[]]$Items) {
  foreach ($item in $Items) {
    [void]$Builder.Append((ParagraphXml -Runs @((New-Run $item 10.5 $brand.Text $false)) -Style "Normal" -Before 0 -After 70 -Numbering 2))
  }
}

function Add-SectionIntro($Builder, [string]$Kicker, [string]$Title, [string]$Description, [bool]$NewPage = $true) {
  if ($NewPage) { [void]$Builder.Append((BreakXml)) }
  Add-Kicker $Builder $Kicker
  Add-Heading $Builder $Title 1
  Add-Paragraph $Builder $Description 10.8 $brand.Muted $false "Normal" "left" 0 180
}

function Add-Callout($Builder, [string]$Label, [string]$Text, [string]$Fill = $brand.Soft, [string]$Accent = $brand.Primary) {
  $rows = @(
    @(New-Cell @((New-Line $Label.ToUpperInvariant() 8.2 $Accent $true "left"), (New-Line $Text 10.2 $brand.Ink $false "left")) $Fill $Accent "left" "top")
  )
  [void]$Builder.Append((TableXml $rows @(9360) $Accent))
  Add-Paragraph $Builder "" 4 $brand.White $false "Normal" "left" 0 30
}

function Add-Screenshot($Builder, [string]$Code, [string]$Screen, [string]$Instruction) {
  $rows = @(
    @(New-Cell @(
      (New-Line "PLACEHOLDER SCREENSHOT" 8.3 $brand.Primary $true "center"),
      (New-Line $Code 14 $brand.Deep $true "center"),
      (New-Line $Screen 11 $brand.Ink $true "center"),
      (New-Line $Instruction 9.3 $brand.Muted $false "center")
    ) "F5FCF8" $brand.Bright "center" "center")
  )
  [void]$Builder.Append((TableXml $rows @(9360) $brand.Bright))
  Add-Paragraph $Builder "" 4 $brand.White $false "Normal" "left" 0 60
}

function Add-Flow($Builder, [object[]]$Steps) {
  $count = $Steps.Count
  $width = [int][math]::Floor(9360 / $count)
  $widths = @(); for ($index = 0; $index -lt $count; $index++) { $widths += $width }
  $cells = foreach ($step in $Steps) {
    New-Cell @((New-Line $step.Number 8.2 $brand.Bright $true "center"), (New-Line $step.Title 9.3 $brand.Ink $true "center"), (New-Line $step.Detail 8.4 $brand.Muted $false "center")) $brand.White $brand.Line "center" "center"
  }
  $rows = [System.Collections.Generic.List[object]]::new()
  [void]$rows.Add($cells)
  [void]$Builder.Append((TableXml -Rows $rows.ToArray() -Widths $widths -OuterBorder $brand.Line))
  Add-Paragraph $Builder "" 4 $brand.White $false "Normal" "left" 0 80
}

function Add-Step($Builder, [string]$Number, [string]$Title, [string]$Description) {
  $rows = [System.Collections.Generic.List[object]]::new()
  [void]$rows.Add(@(
    (New-Cell @((New-Line $Number 14 $brand.White $true "center")) $brand.Primary $brand.Primary "center" "center"),
    (New-Cell @((New-Line $Title 11 $brand.Ink $true "left"), (New-Line $Description 9.8 $brand.Muted $false "left")) $brand.White $brand.Line "left" "top")
  ))
  [void]$Builder.Append((TableXml -Rows $rows.ToArray() -Widths @(1120,8240) -OuterBorder $brand.Line))
  Add-Paragraph $Builder "" 4 $brand.White $false "Normal" "left" 0 50
}

function Add-DataTable($Builder, [string[]]$Headers, [object[]]$Rows, [int[]]$Widths) {
  $headerCells = foreach ($header in $Headers) { New-Cell @((New-Line $header 8.8 $brand.White $true "center")) $brand.Deep $brand.Deep "center" "center" }
  $allRows = [System.Collections.Generic.List[object]]::new()
  [void]$allRows.Add($headerCells)
  foreach ($row in $Rows) {
    $cells = for ($index = 0; $index -lt $row.Count; $index++) {
      $value = $row[$index]
      $fill = if (($allRows.Count % 2) -eq 0) { "F8FCFA" } else { $brand.White }
      New-Cell @((New-Line $value 9.4 $brand.Text $false $(if ($index -eq 0) { "left" } else { "left" }))) $fill $brand.Line "left" "top"
    }
    [void]$allRows.Add($cells)
  }
  [void]$Builder.Append((TableXml -Rows $allRows.ToArray() -Widths $Widths -OuterBorder $brand.Line))
  Add-Paragraph $Builder "" 4 $brand.White $false "Normal" "left" 0 80
}

function Add-Cover($Builder, [string]$Audience, [string]$Title, [string]$Subtitle) {
  Add-Paragraph $Builder "SEKOLAH CITRA NEGARA" 10.5 $brand.Primary $true "Normal" "center" 600 90
  Add-Paragraph $Builder "ABSENSI CN" 8.5 $brand.Bright $true "Normal" "center" 0 120
  $rows = @(
    @(New-Cell @(
      (New-Line "GUIDEBOOK PENGGUNA" 10 $brand.Mint $true "center"),
      (New-Line $Title 27 $brand.White $true "center"),
      (New-Line $Subtitle 13 $brand.Mint $false "center"),
      (New-Line $Audience 10.2 "DFF7EB" $true "center")
    ) $brand.Deep $brand.Deep "center" "center")
  )
  [void]$Builder.Append((TableXml $rows @(9360) $brand.Deep))
  Add-Paragraph $Builder "" 7 $brand.White $false "Normal" "left" 0 80
  Add-Callout $Builder "Cara memakai panduan" "Ikuti urutan langkah, cek kotak penting, lalu sisipkan screenshot aplikasi pada placeholder yang sudah diberi kode." "F1FBF6" $brand.Bright
  Add-Paragraph $Builder "Berlaku untuk operasional Sekolah Citra Negara. Istilah jenjang SMP, SMA, atau SMK akan mengikuti data sekolah dan kelas pada akun yang digunakan." 9.2 $brand.Muted $false "Normal" "center" 100 0
  [void]$Builder.Append((BreakXml))
}

function Add-DocumentMap($Builder, [object[]]$Items) {
  Add-Kicker $Builder "Peta navigasi"
  Add-Heading $Builder "Isi guidebook" 1
  Add-Paragraph $Builder "Gunakan bagian berikut sebagai rute cepat ketika sedang menjalankan tugas di portal." 10.5 $brand.Muted $false "Normal" "left" 0 150
  $rows = @()
  foreach ($item in $Items) {
    $rows += ,@(
      (New-Cell @((New-Line $item[0] 9.2 $brand.Primary $true "center")) $brand.Mint $brand.Line "center" "center"),
      (New-Cell @((New-Line $item[1] 10.2 $brand.Ink $true "left"), (New-Line $item[2] 9.1 $brand.Muted $false "left")) $brand.White $brand.Line "left" "top")
    )
  }
  [void]$Builder.Append((TableXml $rows @(950,8410) $brand.Line))
  Add-Callout $Builder "Catatan penting" "Tampilan desktop dan mobile dapat berbeda susunan, namun nama menu, status, dan tindakan utama tetap sama." "FFF9E8" $brand.Amber
}

function Add-StudentGuide($Builder) {
  Add-Cover $Builder "Untuk siswa SMP, SMA, dan SMK" "Portal Siswa" "Panduan absensi masuk, izin, sakit, dan riwayat kehadiran"

  Add-DocumentMap $Builder @(
    @("01", "Masuk ke portal", "Login dengan NIS dan password akun siswa."),
    @("02", "Memahami dashboard", "Membaca status absensi hari ini, waktu, dan notifikasi."),
    @("03", "Kirim absensi hadir", "Ambil foto, rekam lokasi, lalu kirim absensi."),
    @("04", "Izin atau sakit", "Lengkapi alasan dan bukti sebelum dikirim."),
    @("05", "Pantau hasil", "Cek validasi, histori, dan profil akademik."),
    @("06", "Bantuan cepat", "Tangani kendala kamera, lokasi, atau waktu absensi.")
  )

  Add-SectionIntro $Builder "01 / Akses" "Masuk ke Portal Siswa" "Akses siswa menggunakan NIS, bukan username staff. Pastikan akun yang dipakai adalah akun pribadi yang diberikan sekolah."
  Add-Flow $Builder @(
    [pscustomobject]@{ Number="01"; Title="Buka portal"; Detail="Pilih Portal Siswa" },
    [pscustomobject]@{ Number="02"; Title="Isi NIS"; Detail="Sesuai data sekolah" },
    [pscustomobject]@{ Number="03"; Title="Isi password"; Detail="Gunakan akun pribadi" },
    [pscustomobject]@{ Number="04"; Title="Masuk"; Detail="Lanjut ke dashboard" }
  )
  Add-Numbers $Builder @(
    "Buka halaman Portal Siswa dari landing page atau alamat yang dibagikan sekolah.",
    "Masukkan NIS sesuai data siswa. Jangan memakai NISN pada kolom ini.",
    "Masukkan password akun siswa, lalu pilih Masuk sebagai Siswa.",
    "Setelah berhasil, sistem mengarahkan akun ke Dashboard Siswa."
  )
  Add-Callout $Builder "Keamanan akun" "Jangan membagikan NIS dan password. Jika tidak dapat masuk, hubungi wali kelas atau admin sekolah untuk pengecekan akun." "FFF9E8" $brand.Amber
  Add-Screenshot $Builder "SS-SISWA-01" "Halaman login Portal Siswa" "Sisipkan screenshot form NIS, password, dan tombol Masuk sebagai Siswa."

  Add-SectionIntro $Builder "02 / Dashboard" "Memahami Dashboard Siswa" "Dashboard adalah pusat untuk melihat status hari ini, jadwal jendela absensi, riwayat terbaru, dan notifikasi validasi."
  Add-DataTable $Builder @("Area", "Yang perlu dibaca", "Tindakan") @(
    @("Status hari ini", "Sudah terekam, belum ada record, atau tidak hadir", "Pastikan status sesuai kondisi hari ini."),
    @("Batas waktu", "Batas hadir tepat waktu dan batas terlambat", "Kirim absensi sebelum waktu berakhir."),
    @("Info siswa", "Nama, kelas, waktu absen masuk, dan validasi", "Gunakan untuk memastikan akun dan kelas benar."),
    @("Histori terbaru", "Record absensi dan foto bukti bila tersedia", "Buka histori untuk melihat data lebih lengkap."),
    @("Notification Center", "Informasi pengajuan dan validasi terbaru", "Baca tanggapan dari wali kelas atau sekolah.")
  ) @(2100,4500,2760)
  Add-Screenshot $Builder "SS-SISWA-02" "Dashboard Siswa" "Sisipkan screenshot kartu Absen Hari Ini, Status Hari Ini, dan area Histori Terbaru."

  Add-SectionIntro $Builder "03 / Kehadiran" "Kirim Absen Masuk: Hadir" "Gunakan alur ini saat datang ke sekolah dan jendela absensi masih tersedia. Sistem meminta foto dan membaca lokasi perangkat."
  Add-Callout $Builder "Sebelum mulai" "Aktifkan izin kamera dan lokasi. Ambil foto yang jelas, wajah terlihat, dan gunakan koneksi internet yang stabil." "F1FBF6" $brand.Primary
  Add-Step $Builder "01" "Pilih Absen Hari Ini" "Pada dashboard, pilih tombol Absen Hari Ini. Tombol akan tidak aktif bila absensi sudah terkirim, waktu berakhir, atau akun berada pada cooldown."
  Add-Step $Builder "02" "Ambil atau pilih foto" "Di perangkat mobile, kamera perangkat dapat terbuka langsung. Di desktop, gunakan jendela kamera. Pastikan foto sesuai kondisi saat absen."
  Add-Step $Builder "03" "Tunggu persiapan foto" "Portal mengompres foto otomatis agar upload tetap ringan. Jangan menutup proses sebelum pratinjau muncul."
  Add-Step $Builder "04" "Periksa lokasi" "Lokasi dibaca otomatis. Jika proses belum selesai atau akurasi belum baik, pilih Ambil Ulang Lokasi. Jika radius sekolah aktif, sistem menghitung jarak saat absensi dikirim."
  Add-Step $Builder "05" "Pilih Hadir" "Pada bagian Keterangan, pilih Hadir untuk absensi masuk sekolah."
  Add-Step $Builder "06" "Kirim Absensi" "Periksa foto dan status, lalu pilih Kirim Absensi. Tunggu progres selesai dan notifikasi keberhasilan tampil."
  Add-Screenshot $Builder "SS-SISWA-03" "Modal Foto Absensi Siswa" "Sisipkan screenshot pratinjau foto, bagian Lokasi Pengambilan, pilihan Keterangan, dan tombol Kirim Absensi."

  Add-SectionIntro $Builder "04 / Pengajuan" "Izin dan Sakit" "Izin dan sakit dikirim melalui modal absensi yang sama. Bedanya, siswa perlu memilih keterangan yang tepat dan menulis alasan yang jelas."
  Add-Numbers $Builder @(
    "Mulai dari tombol Absen Hari Ini dan siapkan foto atau bukti pendukung.",
    "Pastikan lokasi telah selesai direkam, lalu pada Keterangan pilih Izin atau Sakit.",
    "Isi alasan sesuai kondisi. Kolom alasan wajib untuk Izin dan Sakit.",
    "Kirim pengajuan dan pantau statusnya pada Dashboard, Histori Absen, atau notifikasi."
  )
  Add-DataTable $Builder @("Pilihan", "Gunakan ketika", "Hal yang wajib diperiksa") @(
    @("Hadir", "Siswa masuk ke sekolah", "Foto jelas, lokasi, dan waktu absensi."),
    @("Izin", "Siswa berhalangan hadir dengan izin", "Alasan jelas dan bukti foto bila diperlukan."),
    @("Sakit", "Siswa tidak dapat hadir karena sakit", "Alasan jelas dan bukti foto bila tersedia.")
  ) @(1700,3500,4160)
  Add-Callout $Builder "Jangan asal memilih status" "Keterangan dan alasan akan dibaca oleh wali kelas serta dapat dipantau BK. Tulis singkat, faktual, dan sesuai keadaan." "FFF1F2" $brand.Rose
  Add-Screenshot $Builder "SS-SISWA-04" "Pengiriman Izin atau Sakit" "Sisipkan screenshot pilihan Izin atau Sakit serta kolom alasan yang sudah terisi."

  Add-SectionIntro $Builder "05 / Hasil" "Status, Validasi, dan Riwayat" "Setelah dikirim, record dapat tampil lebih dulu sebagai menunggu review. Status akhir mengikuti hasil peninjauan wali kelas atau petugas sekolah."
  Add-DataTable $Builder @("Status", "Arti di portal", "Yang dilakukan siswa") @(
    @("Menunggu", "Record atau pengajuan belum selesai ditinjau", "Tunggu notifikasi dan cek histori secara berkala."),
    @("Sudah direview", "Record absensi sudah memperoleh review", "Baca status akhir serta catatan bila ada."),
    @("Diterima", "Pengajuan izin atau sakit diterima", "Simpan bukti bila diperlukan dan cek riwayat."),
    @("Ditolak", "Pengajuan belum dapat diterima", "Baca catatan tanggapan dan hubungi wali kelas bila perlu.")
  ) @(1700,3900,3760)
  Add-Heading $Builder "Histori Absen" 2
  Add-Bullets $Builder @(
    "Buka menu Histori Absen untuk melihat daftar absensi harian dan pengajuan.",
    "Gunakan status dan tanggal pada setiap record untuk membaca perkembangan kehadiran.",
    "Pilih ikon bukti foto atau lampiran bila tersedia untuk melihat evidence yang tersimpan.",
    "Perhatikan catatan review agar tahu alasan perubahan atau tanggapan sekolah."
  )
  Add-Heading $Builder "Profile" 2
  Add-Bullets $Builder @(
    "Buka menu Profile untuk memeriksa nama, NIS, NISN, jenis kelamin, status kelas, kelas aktif, jurusan, dan tahun ajaran.",
    "Jika data akademik tidak sesuai, laporkan ke wali kelas atau admin; siswa tidak mengubah data tersebut dari portal."
  )
  Add-Screenshot $Builder "SS-SISWA-05" "Histori Absen dan Profile" "Sisipkan screenshot tabel histori atau kartu profile yang menampilkan kelas dan tahun ajaran."

  Add-SectionIntro $Builder "06 / Bantuan" "Kendala yang Sering Terjadi" "Gunakan langkah berikut sebelum meminta bantuan ke wali kelas atau admin. Sertakan screenshot error jika masalah masih terjadi."
  Add-DataTable $Builder @("Kendala", "Coba lebih dulu", "Jika belum selesai") @(
    @("Tidak bisa login", "Periksa NIS dan password, termasuk huruf atau angka yang tertukar", "Hubungi wali kelas atau admin untuk cek akun."),
    @("Kamera tidak terbuka", "Izinkan kamera di browser dan tutup aplikasi lain yang memakai kamera", "Muat ulang halaman lalu coba kembali."),
    @("Lokasi belum dihitung", "Aktifkan lokasi, tunggu pembacaan, lalu pilih Ambil Ulang Lokasi", "Pastikan sinyal lokasi membaik; lanjut sesuai instruksi yang tampil."),
    @("Tombol absen tidak aktif", "Cek apakah absensi sudah terkirim atau jendela waktu berakhir", "Tanyakan kebijakan absensi kepada wali kelas."),
    @("Upload terasa lama", "Gunakan koneksi stabil dan tunggu kompres foto selesai", "Jangan menutup modal saat progres pengiriman berjalan.")
  ) @(2150,3900,3310)
  Add-Callout $Builder "Checklist sebelum kirim" "NIS akun benar - foto jelas - lokasi sudah diproses - keterangan tepat - alasan terisi untuk izin/sakit - koneksi stabil." "F1FBF6" $brand.Primary
  Add-Heading $Builder "Daftar screenshot yang perlu disisipkan" 2
  Add-DataTable $Builder @("Kode", "Halaman", "Fokus screenshot") @(
    @("SS-SISWA-01", "Login", "NIS, password, dan tombol masuk."),
    @("SS-SISWA-02", "Dashboard", "Status hari ini dan tombol Absen Hari Ini."),
    @("SS-SISWA-03", "Modal absen", "Foto, lokasi, keterangan, dan tombol kirim."),
    @("SS-SISWA-04", "Izin/Sakit", "Pilihan status dan alasan."),
    @("SS-SISWA-05", "Histori/Profile", "Status review atau data akademik.")
  ) @(1700,2500,5160)
}

function Add-StaffGuide($Builder) {
  Add-Cover $Builder "Untuk guru, wali kelas, guru mapel, dan BK" "Portal Staff" "Panduan monitoring, validasi, pengajaran, dan pembinaan siswa"

  Add-DocumentMap $Builder @(
    @("01", "Akses dan scope", "Masuk sebagai staff dan pahami menu sesuai penugasan."),
    @("02", "Dashboard Guru", "Membaca ringkasan walas, mapel, dan BK."),
    @("03", "Wali Kelas", "Siswa kelas, absensi kelas, dan pengajuan."),
    @("04", "Guru Mapel", "Sesi, validasi, histori, dan rekap mapel."),
    @("05", "Bimbingan Konseling", "Monitoring siswa, absensi, pengajuan, dan konseling."),
    @("06", "Operasional", "Status, laporan, privasi, dan bantuan cepat.")
  )

  Add-SectionIntro $Builder "01 / Akses" "Masuk sebagai Staff" "Portal staff digunakan oleh akun guru, wali kelas, dan BK. Login menggunakan username staff serta password yang terdaftar pada akun sekolah."
  Add-Numbers $Builder @(
    "Buka Portal Staff dari landing page Absensi CN.",
    "Masukkan Username Staff dan password akun.",
    "Pilih Masuk ke Portal Staff untuk membuka Dashboard Guru.",
    "Gunakan menu di sidebar. Menu dapat berbeda karena portal hanya menampilkan ruang kerja yang sesuai penugasan akun."
  )
  Add-Callout $Builder "Prinsip scope" "Seorang guru dapat sekaligus menjadi walas, guru mapel, atau memiliki scope BK. Ketiga ruang kerja dapat muncul pada satu sidebar bila penugasan akun aktif." "F1FBF6" $brand.Primary
  Add-DataTable $Builder @("Ruang kerja", "Muncul jika", "Fungsi utama") @(
    @("Wali Kelas", "Akun menjadi walas aktif", "Memantau kelas, review absensi, dan pengajuan."),
    @("Guru Mapel", "Akun memiliki penugasan mata pelajaran", "Mengelola sesi, validasi, histori, dan rekap mapel."),
    @("BK", "Akun memiliki scope BK", "Monitoring lintas kelas, konseling, review absensi dan pengajuan.")
  ) @(2100,3300,3960)
  Add-Screenshot $Builder "SS-STAFF-01" "Login Portal Staff" "Sisipkan screenshot username staff, password, dan tombol Masuk ke Portal Staff."

  Add-SectionIntro $Builder "02 / Dashboard" "Dashboard Guru dan Sidebar Dinamis" "Dashboard merangkum peran aktif, siswa terpantau, prioritas, pengajuan yang menunggu review, serta informasi sesi mapel jika akun memiliki penugasan mapel."
  Add-Flow $Builder @(
    [pscustomobject]@{ Number="A"; Title="Walas"; Detail="Kelas sendiri" },
    [pscustomobject]@{ Number="B"; Title="Mapel"; Detail="Sesi dan rekap" },
    [pscustomobject]@{ Number="C"; Title="BK"; Detail="Lintas kelas" },
    [pscustomobject]@{ Number="D"; Title="Laporan"; Detail="Cetak sesuai halaman" }
  )
  Add-Bullets $Builder @(
    "Gunakan Dashboard Guru sebagai titik awal untuk memilih prioritas hari ini.",
    "Kartu Kehadiran Hari Ini merangkum status kehadiran pada scope yang tersedia.",
    "Bagian prioritas dapat menampilkan siswa dengan pola telat atau alfa berulang.",
    "Jika ada sesi mapel aktif berdasarkan jadwal, dashboard membantu mengarahkan guru ke aktivitas kelas."
  )
  Add-Screenshot $Builder "SS-STAFF-02" "Dashboard Guru dan sidebar" "Sisipkan screenshot dashboard dengan sidebar yang menunjukkan menu sesuai scope akun."

  Add-SectionIntro $Builder "03 / Wali Kelas" "Ruang Kerja Wali Kelas" "Walas bekerja pada kelas yang ditugaskan: melihat siswa, memeriksa bukti kehadiran, dan meninjau pengajuan izin atau sakit."
  Add-Heading $Builder "Siswa Kelas" 2
  Add-Numbers $Builder @(
    "Pilih menu Siswa Kelas untuk melihat daftar siswa dalam kelas walas.",
    "Gunakan pencarian atau filter yang tersedia untuk menemukan siswa.",
    "Buka detail siswa untuk membaca identitas, ringkasan kehadiran, riwayat absensi, dan pengajuan terbaru.",
    "Gunakan informasi tersebut untuk menentukan tindak lanjut akademik atau komunikasi dengan siswa."
  )
  Add-Screenshot $Builder "SS-WALAS-01" "Siswa Kelas" "Sisipkan screenshot daftar siswa dan tombol/detail siswa."
  Add-Heading $Builder "Review Absensi Kelas" 2
  Add-Step $Builder "01" "Atur konteks" "Buka Absensi Kelas, lalu gunakan tanggal, status, dan pencarian untuk menampilkan record yang perlu diperiksa."
  Add-Step $Builder "02" "Baca bukti" "Buka detail atau bukti foto. Periksa data siswa, waktu absen masuk, foto, lokasi yang tersedia, dan status awal."
  Add-Step $Builder "03" "Tentukan status final" "Pilih status Hadir, Telat, Izin, Sakit, atau Alfa sesuai hasil review."
  Add-Step $Builder "04" "Tulis catatan bila perlu" "Jika status final bukan Hadir, catatan review wajib diisi. Tulis alasan singkat yang faktual."
  Add-Step $Builder "05" "Simpan Review" "Pilih Simpan Review. Record dan dashboard kelas akan diperbarui."
  Add-Callout $Builder "Catatan review" "Gunakan bahasa netral dan dapat dipertanggungjawabkan. Catatan terlihat sebagai konteks tindak lanjut untuk walas dan BK." "FFF9E8" $brand.Amber
  Add-Screenshot $Builder "SS-WALAS-02" "Review Absensi Kelas" "Sisipkan screenshot filter absensi, modal bukti, atau modal Simpan Review."
  Add-Heading $Builder "Review Pengajuan Kelas" 2
  Add-Numbers $Builder @(
    "Buka menu Pengajuan Kelas. Filter berdasarkan status, tipe, atau nama/NIS siswa.",
    "Buka detail untuk membaca alasan, melihat lampiran, lokasi yang tersedia, dan riwayat tanggapan.",
    "Pilih Review untuk mengatur status Menunggu, Diterima, atau Ditolak.",
    "Isi catatan tanggapan dengan jelas, lalu simpan agar siswa dapat membaca hasilnya pada histori."
  )
  Add-Screenshot $Builder "SS-WALAS-03" "Pengajuan Kelas" "Sisipkan screenshot daftar pengajuan dan modal review pengajuan."

  Add-SectionIntro $Builder "04 / Mapel" "Ruang Kerja Guru Mata Pelajaran" "Ruang mapel memakai jadwal dan penugasan aktif. Guru dapat membuka sesi saat ini, melengkapi detail pertemuan, melakukan validasi kehadiran mapel, lalu melihat histori dan rekap."
  Add-Heading $Builder "Sesi Mapel Aktif" 2
  Add-Numbers $Builder @(
    "Buka Sesi Mapel dari sidebar atau buka sesi tertentu melalui Riwayat Sesi.",
    "Untuk sesi aktif, sistem mendeteksi kelas berdasarkan hari dan jam pada jadwal. Bila tidak ada kelas berlangsung, portal menampilkan Tidak ada sesi aktif.",
    "Isi Topik Pertemuan dan Catatan Pengajaran, lalu pilih Simpan Detail sebelum sesi divalidasi.",
    "Periksa daftar siswa, status pagi, status mapel, serta keterangan yang tersedia."
  )
  Add-Heading $Builder "Validasi Kehadiran Mapel" 2
  Add-DataTable $Builder @("Tahap", "Yang dilakukan", "Hasil") @(
    @("Sebelum validasi", "Gunakan Override pada siswa yang masih dapat diedit", "Pilih Hadir, Telat, Alfa Kelas, atau Dispensasi."),
    @("Validasi", "Pilih tombol Validasi pada header sesi", "Status sesi tersimpan dan daftar kehadiran divalidasi."),
    @("Sesudah validasi", "Gunakan Koreksi pada siswa yang masih editable", "Sertakan alasan koreksi untuk perubahan yang dilakukan."),
    @("Terkunci", "Beberapa record dapat ditandai Terkunci", "Status tidak dapat diubah dari sesi tersebut.")
  ) @(1800,4100,3460)
  Add-Callout $Builder "Bedakan status pagi dan mapel" "Status Pagi berasal dari absensi harian. Status Mapel adalah hasil kehadiran pada sesi pembelajaran. Jangan menganggap keduanya selalu sama." "F3E8FF" $brand.Violet
  Add-Screenshot $Builder "SS-MAPEL-01" "Sesi dan Validasi Mapel" "Sisipkan screenshot header sesi, Topik Pertemuan, tabel status pagi/mapel, dan tombol Validasi."
  Add-Heading $Builder "Riwayat Sesi dan Rekap Mapel" 2
  Add-Bullets $Builder @(
    "Pada Sesi Mapel, pilih penugasan mata pelajaran lalu gunakan mode tanggal dan status untuk menelusuri sesi yang sudah tercatat.",
    "Buka satu sesi dari Riwayat untuk melihat kembali detail dan daftar hadirnya.",
    "Pada Rekap Mapel, pilih mata pelajaran dan periode tanggal untuk melihat total pertemuan serta ringkasan setiap siswa.",
    "Gunakan tombol Cetak Laporan pada halaman yang menyediakan laporan setelah data dan filter sudah tepat."
  )
  Add-Screenshot $Builder "SS-MAPEL-02" "Riwayat dan Rekap Mapel" "Sisipkan screenshot filter mata pelajaran, tabel sesi, atau tabel rekap siswa."

  Add-SectionIntro $Builder "05 / BK" "Ruang Kerja Bimbingan Konseling" "BK bekerja lintas kelas dalam scope yang diberikan sekolah. Fokus utamanya adalah pola risiko, tindak lanjut absensi, pengajuan, dan catatan pembinaan."
  Add-Heading $Builder "Monitoring Siswa" 2
  Add-Numbers $Builder @(
    "Buka Monitoring Siswa dan gunakan filter kelas, risiko, atau pencarian.",
    "Buka detail siswa untuk membaca ringkasan hadir, telat, alfa, riwayat absensi, pengajuan, dan catatan BK.",
    "Gunakan Tambah Catatan BK dari detail bila tindak lanjut perlu dicatat.",
    "Tuliskan judul serta catatan pembinaan yang ringkas, objektif, dan relevan."
  )
  Add-Screenshot $Builder "SS-BK-01" "Monitoring Siswa dan Detail" "Sisipkan screenshot filter risiko, daftar siswa, atau detail siswa dengan tombol Tambah Catatan BK."
  Add-Heading $Builder "Review Absensi dan Pengajuan Lintas Kelas" 2
  Add-Bullets $Builder @(
    "Menu Review Absensi membantu BK memfilter tanggal, kelas, status, dan siswa lintas kelas dalam scope.",
    "Buka bukti foto serta evidence lokasi sebelum mengubah status akhir. Gunakan catatan review untuk status yang memerlukan penjelasan.",
    "Menu Pengajuan BK membantu memantau izin atau sakit lintas kelas. Buka detail, lihat lampiran, lalu isi status final dan tanggapan.",
    "Gunakan fokus monitoring untuk memperhatikan pola telat atau alfa berulang."
  )
  Add-Screenshot $Builder "SS-BK-02" "Review Absensi atau Pengajuan BK" "Sisipkan screenshot tabel lintas kelas dan modal review."
  Add-Heading $Builder "Catatan Konseling" 2
  Add-Numbers $Builder @(
    "Buka Konseling untuk melihat seluruh catatan yang berada dalam scope BK.",
    "Pilih Catatan Konseling untuk membuat catatan baru, lalu pilih siswa, isi judul, dan tulis catatan pembinaan.",
    "Gunakan aksi lihat untuk membaca detail, edit untuk memperbarui, dan hapus hanya setelah memastikan catatan memang tidak diperlukan.",
    "Simpan catatan secara profesional: fakta, observasi, tindak lanjut, dan rekomendasi seperlunya."
  )
  Add-Callout $Builder "Privasi dan etika" "Catatan BK memuat konteks pembinaan siswa. Hindari opini merendahkan, informasi di luar kebutuhan sekolah, atau detail yang tidak relevan dengan tindak lanjut." "FFF1F2" $brand.Rose
  Add-Screenshot $Builder "SS-BK-03" "Konseling" "Sisipkan screenshot daftar catatan, form tambah/edit, atau detail catatan BK."

  Add-SectionIntro $Builder "06 / Operasional" "Status, Laporan, dan Bantuan" "Gunakan referensi ini untuk menjaga keputusan review konsisten di seluruh ruang kerja staff."
  Add-DataTable $Builder @("Status", "Makna operasional", "Catatan") @(
    @("Hadir", "Kehadiran sesuai hasil review", "Tidak memerlukan catatan review tambahan."),
    @("Telat", "Siswa hadir di luar batas tepat waktu", "Gunakan catatan bila perlu untuk konteks."),
    @("Izin / Sakit", "Kehadiran berhalangan dengan pengajuan", "Baca alasan, lampiran, serta hasil review."),
    @("Alfa", "Tidak hadir tanpa status yang dapat diterima", "Tulis catatan objektif jika status ditetapkan melalui review."),
    @("Dispensasi", "Status mapel khusus pada sesi pembelajaran", "Gunakan sesuai kebijakan kelas atau sekolah.")
  ) @(1800,4000,3560)
  Add-Heading $Builder "Cetak Laporan" 2
  Add-Bullets $Builder @(
    "Gunakan Cetak Laporan setelah filter kelas, status, mata pelajaran, dan periode sudah benar.",
    "Pastikan data yang ditampilkan adalah scope akun yang sesuai sebelum mencetak atau membagikan laporan.",
    "Jika report kosong, periksa filter, rentang tanggal, dan apakah sesi atau record sudah tervalidasi."
  )
  Add-DataTable $Builder @("Kendala", "Langkah awal", "Eskalasi") @(
    @("Menu tidak muncul", "Periksa apakah akun memiliki penugasan walas, mapel, atau scope BK", "Minta admin mengecek penugasan akun."),
    @("Sesi mapel tidak ada", "Pastikan hari, jam, dan jadwal penugasan aktif", "Hubungi admin akademik bila jadwal belum sesuai."),
    @("Data belum berubah", "Muat ulang area atau cek apakah penyimpanan/review berhasil", "Periksa notifikasi error dan ulangi bila aman."),
    @("Bukti tidak terbuka", "Periksa koneksi dan buka ulang detail record", "Laporkan record serta waktu kejadian ke admin.")
  ) @(2100,3900,3360)
  Add-Heading $Builder "Daftar screenshot yang perlu disisipkan" 2
  Add-DataTable $Builder @("Kode", "Halaman", "Fokus screenshot") @(
    @("SS-STAFF-01", "Login Staff", "Username, password, tombol masuk."),
    @("SS-STAFF-02", "Dashboard", "Sidebar dinamis dan ringkasan peran."),
    @("SS-WALAS-01", "Siswa Kelas", "Daftar dan detail siswa."),
    @("SS-WALAS-02", "Review Absensi", "Filter, bukti, dan status final."),
    @("SS-WALAS-03", "Pengajuan", "Detail lampiran dan review."),
    @("SS-MAPEL-01", "Sesi Mapel", "Detail sesi, status, validasi."),
    @("SS-MAPEL-02", "Riwayat/Rekap", "Filter dan tabel rekap."),
    @("SS-BK-01", "Monitoring", "Risiko, detail siswa, catatan BK."),
    @("SS-BK-02", "Review BK", "Absensi atau pengajuan lintas kelas."),
    @("SS-BK-03", "Konseling", "Daftar dan form catatan.")
  ) @(1700,2550,5110)
}

# Edisi 2 memakai ritme editorial: hanya data pembanding yang disajikan sebagai tabel.
function Add-EditorialCoverV2($Builder, [string]$Audience, [string]$Title, [string]$Subtitle, [string]$Edition) {
  Add-Paragraph $Builder "SEKOLAH CITRA NEGARA" 10.5 $brand.Primary $true "Normal" "left" 420 60
  Add-Paragraph $Builder "ABSENSI CN  /  $Edition" 8.6 $brand.Bright $true "Normal" "left" 0 180
  Add-Paragraph $Builder $Title 30 $brand.Ink $true "Normal" "left" 0 90
  Add-Paragraph $Builder $Subtitle 13.2 $brand.Muted $false "Normal" "left" 0 260
  $rows = [System.Collections.Generic.List[object]]::new()
  [void]$rows.Add(@(
    (New-Cell @((New-Line "UNTUK" 8.1 $brand.Bright $true "left"), (New-Line $Audience 10.2 $brand.Ink $true "left")) "F1FBF6" $brand.Line "left" "center"),
    (New-Cell @((New-Line "CARA MEMAKAI" 8.1 $brand.Bright $true "left"), (New-Line "Baca per bagian, lalu sisipkan screenshot sesuai kode yang tersedia." 10.0 $brand.Ink $false "left")) $brand.Mint $brand.Line "left" "center")
  ))
  [void]$Builder.Append((TableXml -Rows $rows.ToArray() -Widths @(4100,5260) -OuterBorder $brand.Line))
  Add-Paragraph $Builder "Panduan ini mengikuti alur Portal Absensi CN yang digunakan di Sekolah Citra Negara. Nama kelas dan jenjang menyesuaikan akun sekolah yang sedang aktif." 9.3 $brand.Muted $false "Normal" "left" 180 0
  [void]$Builder.Append((BreakXml))
}

function Add-SectionBannerV2($Builder, [string]$Kicker, [string]$Title, [string]$Description, [string]$Accent = $brand.Primary, [bool]$NewPage = $true) {
  if ($NewPage) { [void]$Builder.Append((BreakXml)) }
  Add-Kicker $Builder $Kicker
  Add-Paragraph $Builder $Title 19 $brand.Ink $true "Normal" "left" 0 70
  Add-Paragraph $Builder $Description 10.8 $brand.Muted $false "Normal" "left" 0 150
  $rows = [System.Collections.Generic.List[object]]::new()
  [void]$rows.Add(@((New-Cell @((New-Line "FOKUS BAGIAN INI" 8.1 $Accent $true "left")) "F8FCFA" $Accent "left" "center")))
  [void]$Builder.Append((TableXml -Rows $rows.ToArray() -Widths @(9360) -OuterBorder $Accent))
  Add-Paragraph $Builder "" 4 $brand.White $false "Normal" "left" 0 45
}

function Add-RoleCardsV2($Builder, [object[]]$Cards) {
  $width = [int][math]::Floor(9360 / $Cards.Count)
  $widths = @(); for ($index = 0; $index -lt $Cards.Count; $index++) { $widths += $width }
  $cells = foreach ($card in $Cards) {
    New-Cell @(
      (New-Line $card.Tag.ToUpperInvariant() 8.0 $card.Accent $true "left"),
      (New-Line $card.Title 11.2 $brand.Ink $true "left"),
      (New-Line $card.Detail 9.2 $brand.Muted $false "left")
    ) $card.Fill $card.Accent "left" "top"
  }
  $rows = [System.Collections.Generic.List[object]]::new(); [void]$rows.Add($cells)
  [void]$Builder.Append((TableXml -Rows $rows.ToArray() -Widths $widths -OuterBorder $brand.Line))
  Add-Paragraph $Builder "" 4 $brand.White $false "Normal" "left" 0 70
}

function Add-DecisionPairV2($Builder, [string]$LeftTag, [string]$LeftTitle, [string]$LeftText, [string]$LeftFill, [string]$LeftAccent, [string]$RightTag, [string]$RightTitle, [string]$RightText, [string]$RightFill, [string]$RightAccent) {
  $rows = [System.Collections.Generic.List[object]]::new()
  [void]$rows.Add(@(
    (New-Cell @((New-Line $LeftTag.ToUpperInvariant() 8.0 $LeftAccent $true "left"), (New-Line $LeftTitle 11.5 $brand.Ink $true "left"), (New-Line $LeftText 9.4 $brand.Text $false "left")) $LeftFill $LeftAccent "left" "top"),
    (New-Cell @((New-Line $RightTag.ToUpperInvariant() 8.0 $RightAccent $true "left"), (New-Line $RightTitle 11.5 $brand.Ink $true "left"), (New-Line $RightText 9.4 $brand.Text $false "left")) $RightFill $RightAccent "left" "top")
  ))
  [void]$Builder.Append((TableXml -Rows $rows.ToArray() -Widths @(4680,4680) -OuterBorder $brand.Line))
  Add-Paragraph $Builder "" 4 $brand.White $false "Normal" "left" 0 70
}

function Add-ProcessV2($Builder, [object[]]$Steps, [string]$Accent = $brand.Primary) {
  foreach ($step in $Steps) {
    $rows = [System.Collections.Generic.List[object]]::new()
    [void]$rows.Add(@(
      (New-Cell @((New-Line $step.No 14 $brand.White $true "center")) $Accent $Accent "center" "center"),
      (New-Cell @((New-Line $step.Title 11.3 $brand.Ink $true "left"), (New-Line $step.Detail 9.8 $brand.Muted $false "left")) $brand.White $brand.Line "left" "top")
    ))
    [void]$Builder.Append((TableXml -Rows $rows.ToArray() -Widths @(1040,8320) -OuterBorder $brand.Line))
    Add-Paragraph $Builder "" 4 $brand.White $false "Normal" "left" 0 38
  }
}

function Add-ChecklistV2($Builder, [string]$Label, [string[]]$Items, [string]$Fill = "F1FBF6", [string]$Accent = $brand.Primary) {
  $lines = [System.Collections.Generic.List[object]]::new()
  [void]$lines.Add((New-Line $Label.ToUpperInvariant() 8.2 $Accent $true "left"))
  foreach ($item in $Items) { [void]$lines.Add((New-Line "CHECK  $item" 9.8 $brand.Text $false "left")) }
  $rows = [System.Collections.Generic.List[object]]::new(); [void]$rows.Add((New-Cell $lines.ToArray() $Fill $Accent "left" "top"))
  [void]$Builder.Append((TableXml -Rows $rows.ToArray() -Widths @(9360) -OuterBorder $Accent))
  Add-Paragraph $Builder "" 4 $brand.White $false "Normal" "left" 0 65
}

function Add-ScreenshotV2($Builder, [string]$Code, [string]$Screen, [string]$Instruction, [string]$Accent = $brand.Primary) {
  $rows = [System.Collections.Generic.List[object]]::new()
  [void]$rows.Add(@(
    (New-Cell @((New-Line "TARUH SCREENSHOT" 8.1 $brand.White $true "center"), (New-Line $Code 11.5 $brand.White $true "center")) $Accent $Accent "center" "center"),
    (New-Cell @((New-Line $Screen 10.8 $brand.Ink $true "left"), (New-Line $Instruction 9.2 $brand.Muted $false "left")) "F8FCFA" $Accent "left" "center")
  ))
  [void]$Builder.Append((TableXml -Rows $rows.ToArray() -Widths @(2300,7060) -OuterBorder $Accent))
  Add-Paragraph $Builder "" 4 $brand.White $false "Normal" "left" 0 70
}

function Add-StudentGuideV2($Builder) {
  Add-EditorialCoverV2 $Builder "Siswa SMP, SMA, dan SMK" "Hadir dengan tenang." "Field guide singkat untuk absen masuk, izin/sakit, dan memantau hasilnya." "EDISI SISWA 2026"

  Add-SectionBannerV2 $Builder "01 / MULAI" "Sebelum membuka portal" "Absensi yang rapi dimulai dari akun yang benar, izin perangkat yang aktif, dan pemahaman kapan harus mengirim." $brand.Primary $false
  Add-RoleCardsV2 $Builder @(
    [pscustomobject]@{ Tag="Akun"; Title="Gunakan NIS"; Detail="Kolom masuk siswa memakai NIS, bukan NISN dan bukan username staff."; Fill="F1FBF6"; Accent=$brand.Primary },
    [pscustomobject]@{ Tag="Perangkat"; Title="Izinkan kamera"; Detail="Kamera dipakai untuk menyiapkan bukti foto saat absensi dikirim."; Fill="E0F2FE"; Accent=$brand.Sky },
    [pscustomobject]@{ Tag="Lokasi"; Title="Aktifkan lokasi"; Detail="Lokasi direkam agar sistem dapat menilai posisi terhadap radius sekolah."; Fill="FFF9E8"; Accent=$brand.Amber }
  )
  Add-ProcessV2 $Builder @(
    [pscustomobject]@{ No="01"; Title="Masuk ke Portal Siswa"; Detail="Buka Portal Siswa dari landing page Absensi CN." },
    [pscustomobject]@{ No="02"; Title="Isi NIS dan password"; Detail="Pastikan NIS sesuai data sekolah. Jangan memakai NISN pada kolom NIS." },
    [pscustomobject]@{ No="03"; Title="Periksa dashboard"; Detail="Setelah masuk, lihat status hari ini dan batas waktu sebelum memulai absensi." }
  ) $brand.Primary
  Add-ChecklistV2 $Builder "Sebelum klik absen" @("Akun yang dipakai adalah akun pribadi.", "Kamera dan lokasi sudah diizinkan.", "Koneksi internet cukup stabil untuk mengirim foto.") "F1FBF6" $brand.Primary
  Add-ScreenshotV2 $Builder "SS-SISWA-01" "Login Portal Siswa" "Gunakan screenshot yang memperlihatkan kolom NIS, password, dan tombol Masuk sebagai Siswa." $brand.Primary

  Add-SectionBannerV2 $Builder "02 / ORIENTASI" "Baca dashboard seperti panel kontrol" "Dashboard tidak hanya tempat menekan tombol absen. Ia memberi konteks apakah absensi sudah masuk, kapan batas waktu berakhir, dan apakah ada hasil review baru." $brand.Sky
  Add-DecisionPairV2 $Builder "SEBELUM ABSEN" "Status hari ini" "Cek apakah record sudah ada. Bila sudah terkirim, jangan membuat pengajuan kedua tanpa arahan sekolah." "E0F2FE" $brand.Sky "SETELAH ABSEN" "Notifikasi & histori" "Pantau perubahan status atau tanggapan wali kelas melalui histori dan notifikasi yang tersedia." "F1FBF6" $brand.Primary
  Add-ChecklistV2 $Builder "Yang perlu diperiksa di dashboard" @("Batas hadir tepat waktu dan batas terlambat.", "Kelas dan identitas yang tercantum pada akun.", "Riwayat terbaru, status review, serta notifikasi pengajuan.") "F8FCFA" $brand.Sky
  Add-ScreenshotV2 $Builder "SS-SISWA-02" "Dashboard Siswa" "Fokuskan screenshot pada kartu Absen Hari Ini, Status Hari Ini, informasi waktu, dan histori terbaru." $brand.Sky

  Add-SectionBannerV2 $Builder "03 / HADIR" "Enam checkpoint sebelum mengirim" "Gunakan alur ini ketika hadir di sekolah. Jangan terburu-buru menekan kirim sebelum foto, lokasi, dan keterangan sudah siap." $brand.Primary
  Add-ProcessV2 $Builder @(
    [pscustomobject]@{ No="01"; Title="Buka Absen Hari Ini"; Detail="Tombol dapat tidak aktif jika absensi telah terkirim, waktu berakhir, atau akun sedang cooldown." },
    [pscustomobject]@{ No="02"; Title="Ambil foto kehadiran"; Detail="Pastikan wajah terlihat jelas. Tunggu sampai pratinjau foto muncul setelah proses kompres otomatis." },
    [pscustomobject]@{ No="03"; Title="Rekam lokasi"; Detail="Tunggu lokasi terbaca. Jika akurasi kurang baik, gunakan Ambil Ulang Lokasi dan tunggu kembali." },
    [pscustomobject]@{ No="04"; Title="Pilih Hadir"; Detail="Pada Keterangan, gunakan Hadir untuk absensi masuk sekolah." },
    [pscustomobject]@{ No="05"; Title="Cek bukti terakhir"; Detail="Pastikan foto, lokasi, dan status terlihat sesuai sebelum pengiriman." },
    [pscustomobject]@{ No="06"; Title="Kirim Absensi"; Detail="Tunggu proses selesai dan notifikasi keberhasilan tampil. Jika radius sekolah aktif, jarak dihitung saat absensi dikirim." }
  ) $brand.Primary
  Add-Callout $Builder "Ingat" "Jangan menutup modal ketika foto sedang dikompres atau pengiriman masih berlangsung. Bukti foto dan lokasi diproses sebagai satu record absensi." "FFF9E8" $brand.Amber
  Add-ScreenshotV2 $Builder "SS-SISWA-03" "Modal Foto Absensi" "Perlihatkan pratinjau foto, Lokasi Pengambilan, pilihan Keterangan, dan tombol Kirim Absensi." $brand.Primary

  Add-SectionBannerV2 $Builder "04 / IZIN & SAKIT" "Pilih status yang sesuai keadaan" "Izin dan sakit menggunakan modal yang sama, tetapi keduanya membutuhkan alasan yang jelas. Tulis singkat, faktual, dan mudah dipahami." $brand.Violet
  Add-DecisionPairV2 $Builder "IZIN" "Ada keperluan yang sah" "Pilih Izin ketika berhalangan hadir karena alasan yang sesuai kebijakan sekolah. Isi alasan secara ringkas dan jelas." "F3E8FF" $brand.Violet "SAKIT" "Tidak dapat hadir karena kondisi kesehatan" "Pilih Sakit ketika kondisi kesehatan membuat siswa tidak dapat hadir. Tambahkan alasan dan bukti foto bila diperlukan." "FFF1F2" $brand.Rose
  Add-ProcessV2 $Builder @(
    [pscustomobject]@{ No="01"; Title="Siapkan bukti dan lokasi"; Detail="Foto tetap disiapkan melalui modal absensi, lalu pastikan lokasi selesai direkam." },
    [pscustomobject]@{ No="02"; Title="Pilih Izin atau Sakit"; Detail="Ubah Keterangan dari Hadir ke status yang paling sesuai." },
    [pscustomobject]@{ No="03"; Title="Tulis alasan dan kirim"; Detail="Kolom alasan wajib untuk Izin dan Sakit. Setelah dikirim, pantau hasilnya melalui histori atau notifikasi." }
  ) $brand.Violet
  Add-ScreenshotV2 $Builder "SS-SISWA-04" "Pengajuan Izin atau Sakit" "Tampilkan pilihan status dan contoh area alasan yang sudah diisi." $brand.Violet

  Add-SectionBannerV2 $Builder "05 / HASIL" "Setelah tombol kirim ditekan" "Pengiriman bukan akhir proses. Record dapat menunggu review, kemudian memperoleh status atau catatan dari wali kelas maupun sekolah." $brand.Primary
  Add-RoleCardsV2 $Builder @(
    [pscustomobject]@{ Tag="01"; Title="Menunggu"; Detail="Record atau pengajuan belum selesai ditinjau."; Fill="FFF9E8"; Accent=$brand.Amber },
    [pscustomobject]@{ Tag="02"; Title="Direview"; Detail="Status akhir dan catatan review sudah tersedia."; Fill="E0F2FE"; Accent=$brand.Sky },
    [pscustomobject]@{ Tag="03"; Title="Tindak lanjut"; Detail="Baca histori, simpan bukti bila perlu, lalu hubungi walas jika ada hal yang perlu diklarifikasi."; Fill="F1FBF6"; Accent=$brand.Primary }
  )
  Add-DecisionPairV2 $Builder "HISTORI ABSEN" "Lihat perjalanan record" "Gunakan Histori Absen untuk membaca tanggal, status, bukti, serta catatan review pada setiap record." "F8FCFA" $brand.Sky "PROFILE" "Periksa identitas akademik" "Nama, NIS, NISN, kelas, jurusan, dan tahun ajaran dibaca dari data sekolah. Laporkan kesalahan ke walas atau admin." "F1FBF6" $brand.Primary
  Add-ScreenshotV2 $Builder "SS-SISWA-05" "Histori Absen dan Profile" "Gunakan screenshot yang memperlihatkan status review atau informasi kelas dan tahun ajaran." $brand.Primary

  Add-SectionBannerV2 $Builder "06 / BANTUAN CEPAT" "Jika sesuatu tidak berjalan" "Mulai dari penyebab yang paling dekat dengan perangkat atau akun sebelum menghubungi wali kelas maupun admin." $brand.Amber
  Add-DataTable $Builder @("Situasi", "Langkah pertama", "Eskalasi yang tepat") @(
    @("Tidak bisa login", "Periksa NIS dan password; jangan memakai NISN.", "Wali kelas atau admin memeriksa akun."),
    @("Kamera/lokasi tidak siap", "Izinkan browser, tutup aplikasi lain, lalu ambil ulang.", "Kirim screenshot error bila tetap gagal."),
    @("Absensi tidak aktif", "Cek apakah sudah ada record atau batas waktu berakhir.", "Tanyakan kebijakan absensi ke wali kelas."),
    @("Upload lambat", "Tunggu kompres selesai dan gunakan koneksi stabil.", "Jangan tutup modal selama proses berjalan.")
  ) @(2200,4000,3160)
  Add-ChecklistV2 $Builder "Ringkasan paling penting" @("Gunakan NIS, bukan NISN.", "Foto harus jelas dan lokasi harus diproses.", "Izin/sakit memerlukan alasan.", "Histori adalah sumber utama untuk membaca hasil review.") "FFF9E8" $brand.Amber
}

function Add-StaffGuideV2($Builder) {
  Add-EditorialCoverV2 $Builder "Guru, wali kelas, guru mapel, dan BK" "Mengelola kehadiran dengan konteks." "Operational playbook untuk monitoring, review, pengajaran, dan pembinaan siswa." "EDISI STAFF 2026"

  Add-SectionBannerV2 $Builder "01 / AKSES & SCOPE" "Satu akun, beberapa ruang kerja" "Sidebar mengikuti penugasan akun. Seorang guru dapat memiliki satu, dua, atau tiga peran sekaligus; menu yang terlihat adalah batas kerja yang sah." $brand.Primary $false
  Add-RoleCardsV2 $Builder @(
    [pscustomobject]@{ Tag="WALAS"; Title="Kelas binaan"; Detail="Siswa kelas, review absensi, dan pengajuan izin/sakit."; Fill="F1FBF6"; Accent=$brand.Primary },
    [pscustomobject]@{ Tag="MAPEL"; Title="Sesi pembelajaran"; Detail="Sesi aktif, validasi kehadiran mapel, riwayat, dan rekap."; Fill="E0F2FE"; Accent=$brand.Sky },
    [pscustomobject]@{ Tag="BK"; Title="Monitoring lintas kelas"; Detail="Risiko siswa, review lintas kelas, dan catatan konseling."; Fill="F3E8FF"; Accent=$brand.Violet }
  )
  Add-ProcessV2 $Builder @(
    [pscustomobject]@{ No="01"; Title="Masuk sebagai staff"; Detail="Gunakan username staff dan password akun pada Portal Staff." },
    [pscustomobject]@{ No="02"; Title="Kenali sidebar"; Detail="Jangan menganggap menu yang tidak muncul sebagai error; menu hanya tampil sesuai scope aktif." },
    [pscustomobject]@{ No="03"; Title="Mulai dari Dashboard Guru"; Detail="Gunakan ringkasan hari ini untuk memilih prioritas walas, mapel, atau BK." }
  ) $brand.Primary
  Add-ScreenshotV2 $Builder "SS-STAFF-01" "Login Portal Staff" "Tampilkan username staff, password, dan tombol Masuk ke Portal Staff." $brand.Primary

  Add-SectionBannerV2 $Builder "02 / DASHBOARD" "Pilih prioritas, bukan sekadar membuka menu" "Dashboard Guru merangkum peran aktif, siswa yang perlu perhatian, pengajuan menunggu review, serta konteks sesi mapel ketika tersedia." $brand.Sky
  Add-DecisionPairV2 $Builder "KETIKA MENJADI WALAS" "Mulai dari kelas" "Periksa siswa yang perlu ditindaklanjuti, absensi yang menunggu review, dan pengajuan baru." "F1FBF6" $brand.Primary "KETIKA MEMILIKI MAPEL" "Mulai dari sesi" "Cek apakah ada sesi aktif sesuai jadwal, lalu lengkapi detail dan validasi kehadiran bila waktunya tepat." "E0F2FE" $brand.Sky
  Add-ChecklistV2 $Builder "Pertanyaan sebelum bekerja" @("Peran mana yang sedang membutuhkan tindakan hari ini?", "Apakah ada status atau pengajuan menunggu review?", "Apakah filter tanggal, kelas, dan mapel sudah tepat sebelum mengambil keputusan?") "F8FCFA" $brand.Sky
  Add-ScreenshotV2 $Builder "SS-STAFF-02" "Dashboard Guru dan Sidebar" "Perlihatkan sidebar dinamis serta kartu ringkasan peran atau prioritas." $brand.Sky

  Add-SectionBannerV2 $Builder "03 / WALAS" "Review dengan bukti, bukan asumsi" "Wali kelas bekerja pada siswa dalam kelas binaan: membaca konteks, meninjau bukti, lalu menyimpan keputusan yang dapat dipertanggungjawabkan." $brand.Primary
  Add-DecisionPairV2 $Builder "SISWA KELAS" "Bangun konteks" "Gunakan pencarian dan detail siswa untuk membaca identitas, ringkasan hadir, riwayat absensi, dan pengajuan terbaru." "F1FBF6" $brand.Primary "PENGAJUAN KELAS" "Berikan keputusan jelas" "Baca alasan dan lampiran, lalu atur Menunggu, Diterima, atau Ditolak dengan tanggapan yang dapat dibaca siswa." "FFF9E8" $brand.Amber
  Add-ProcessV2 $Builder @(
    [pscustomobject]@{ No="01"; Title="Atur konteks"; Detail="Di Absensi Kelas, gunakan tanggal, status, dan pencarian untuk menemukan record yang perlu diperiksa." },
    [pscustomobject]@{ No="02"; Title="Baca bukti"; Detail="Periksa identitas siswa, waktu, foto, lokasi yang tersedia, dan status awal sebelum mengubah apa pun." },
    [pscustomobject]@{ No="03"; Title="Pilih status final"; Detail="Gunakan Hadir, Telat, Izin, Sakit, atau Alfa sesuai hasil review." },
    [pscustomobject]@{ No="04"; Title="Tulis catatan bila diperlukan"; Detail="Saat status final bukan Hadir, catatan review wajib diisi. Gunakan bahasa singkat, netral, dan faktual." },
    [pscustomobject]@{ No="05"; Title="Simpan review"; Detail="Setelah tersimpan, record dan ringkasan kelas akan diperbarui." }
  ) $brand.Primary
  Add-Callout $Builder "Standar catatan walas" "Tuliskan konteks yang relevan untuk tindak lanjut. Hindari opini, dugaan, atau label terhadap siswa. Catatan menjadi jembatan informasi antara walas dan BK." "FFF9E8" $brand.Amber
  Add-ScreenshotV2 $Builder "SS-WALAS-01" "Siswa Kelas" "Gunakan screenshot daftar siswa atau detail siswa yang menunjukkan ringkasan kehadiran." $brand.Primary
  Add-ScreenshotV2 $Builder "SS-WALAS-02" "Review Absensi Kelas" "Tampilkan filter, bukti foto atau lokasi, pilihan status final, dan area catatan review." $brand.Primary
  Add-ScreenshotV2 $Builder "SS-WALAS-03" "Pengajuan Kelas" "Perlihatkan daftar pengajuan, lampiran, serta modal atau panel review." $brand.Primary

  Add-SectionBannerV2 $Builder "04 / MAPEL" "Kelola sesi sebagai siklus pembelajaran" "Ruang mapel mengikuti jadwal dan penugasan aktif. Fokusnya bukan hanya mencatat hadir, melainkan mengikat kehadiran pada sesi, topik, dan proses validasi." $brand.Sky
  Add-RoleCardsV2 $Builder @(
    [pscustomobject]@{ Tag="SEBELUM"; Title="Buka sesi yang benar"; Detail="Sesi aktif mengikuti hari, jam, kelas, dan jadwal. Jika tidak ada, portal menampilkan bahwa tidak ada sesi aktif."; Fill="E0F2FE"; Accent=$brand.Sky },
    [pscustomobject]@{ Tag="SAAT SESI"; Title="Lengkapi konteks"; Detail="Simpan Topik Pertemuan dan Catatan Pengajaran sebelum melakukan validasi."; Fill="F1FBF6"; Accent=$brand.Primary },
    [pscustomobject]@{ Tag="SESUDAH"; Title="Baca riwayat"; Detail="Gunakan Riwayat Sesi dan Rekap Mapel untuk meninjau pertemuan serta ringkasan siswa."; Fill="FFF9E8"; Accent=$brand.Amber }
  )
  Add-ProcessV2 $Builder @(
    [pscustomobject]@{ No="01"; Title="Periksa sesi dan daftar siswa"; Detail="Cek kelas, jadwal, serta Status Pagi dan Status Mapel pada daftar siswa." },
    [pscustomobject]@{ No="02"; Title="Atur status sebelum validasi"; Detail="Gunakan Override pada record yang masih dapat diedit: Hadir, Telat, Alfa Kelas, atau Dispensasi." },
    [pscustomobject]@{ No="03"; Title="Validasi sesi"; Detail="Pilih Validasi setelah topik, catatan, dan kehadiran sudah diperiksa. Validasi menyimpan status sesi." },
    [pscustomobject]@{ No="04"; Title="Koreksi secara bertanggung jawab"; Detail="Pada record yang masih editable, gunakan Koreksi dan sertakan alasan perubahan. Record terkunci tidak dapat diubah dari sesi tersebut." }
  ) $brand.Sky
  Add-DecisionPairV2 $Builder "STATUS PAGI" "Absensi harian siswa" "Status ini berasal dari absensi masuk siswa dan tidak otomatis sama dengan kehadiran pada satu sesi pembelajaran." "E0F2FE" $brand.Sky "STATUS MAPEL" "Kehadiran pada sesi" "Status ini menggambarkan kehadiran siswa dalam pembelajaran tertentu setelah proses sesi dan validasi." "F3E8FF" $brand.Violet
  Add-ScreenshotV2 $Builder "SS-MAPEL-01" "Sesi dan Validasi Mapel" "Tampilkan header sesi, Topik Pertemuan, daftar siswa, status pagi/mapel, dan tombol Validasi." $brand.Sky
  Add-ScreenshotV2 $Builder "SS-MAPEL-02" "Riwayat dan Rekap Mapel" "Gunakan screenshot filter mapel, riwayat sesi, atau tabel rekap per siswa." $brand.Sky

  Add-SectionBannerV2 $Builder "05 / BK" "Dari sinyal ke tindak lanjut" "BK bekerja lintas kelas dalam scope aktif. Gunakan data untuk melihat pola, lalu dokumentasikan tindakan secara profesional dan proporsional." $brand.Violet
  Add-ProcessV2 $Builder @(
    [pscustomobject]@{ No="01"; Title="Amati pola"; Detail="Di Monitoring Siswa, gunakan filter kelas, risiko, dan pencarian untuk menemukan siswa yang membutuhkan perhatian." },
    [pscustomobject]@{ No="02"; Title="Baca konteks lengkap"; Detail="Buka detail siswa untuk melihat ringkasan hadir, telat, alfa, riwayat absensi, pengajuan, dan catatan yang relevan." },
    [pscustomobject]@{ No="03"; Title="Review lintas kelas"; Detail="Pada Review Absensi atau Pengajuan BK, periksa bukti dan alasan sebelum menetapkan atau menyarankan tindak lanjut." },
    [pscustomobject]@{ No="04"; Title="Catat pembinaan"; Detail="Di Konseling, pilih siswa, isi judul, lalu tulis fakta, observasi, tindak lanjut, dan rekomendasi seperlunya." }
  ) $brand.Violet
  Add-DecisionPairV2 $Builder "CATATAN YANG BAIK" "Faktual dan berguna" "Catatan menjelaskan observasi, respons, serta langkah berikutnya yang relevan dengan pembinaan siswa." "F3E8FF" $brand.Violet "YANG HARUS DIHINDARI" "Tidak menghakimi" "Hindari opini merendahkan, informasi personal yang tidak relevan, dan detail yang tidak diperlukan untuk tindak lanjut sekolah." "FFF1F2" $brand.Rose
  Add-ScreenshotV2 $Builder "SS-BK-01" "Monitoring Siswa" "Perlihatkan filter risiko, daftar siswa, atau halaman detail dengan ringkasan kehadiran." $brand.Violet
  Add-ScreenshotV2 $Builder "SS-BK-02" "Review BK" "Gunakan screenshot review absensi atau pengajuan lintas kelas beserta area bukti dan status." $brand.Violet
  Add-ScreenshotV2 $Builder "SS-BK-03" "Konseling" "Tampilkan daftar catatan, form tambah/edit, atau detail catatan konseling." $brand.Violet

  Add-SectionBannerV2 $Builder "06 / OPERASIONAL" "Keputusan yang konsisten" "Gunakan referensi singkat ini sebelum menyimpan review, mencetak laporan, atau menutup sesi kerja." $brand.Amber
  Add-DataTable $Builder @("Status", "Gunakan ketika", "Catatan operasional") @(
    @("Hadir", "Kehadiran sesuai hasil review.", "Tidak membutuhkan catatan tambahan kecuali ada konteks khusus."),
    @("Telat", "Siswa hadir di luar batas tepat waktu.", "Tambahkan konteks bila memang diperlukan."),
    @("Izin / Sakit", "Ada pengajuan dan alasan yang perlu dibaca.", "Periksa alasan, lampiran, serta hasil review."),
    @("Alfa", "Tidak ada status kehadiran yang dapat diterima.", "Gunakan catatan objektif saat ditetapkan melalui review."),
    @("Dispensasi", "Kebutuhan khusus pada sesi mapel.", "Terapkan sesuai kebijakan kelas atau sekolah.")
  ) @(1700,4050,3610)
  Add-ChecklistV2 $Builder "Sebelum mencetak laporan" @("Filter kelas, status, mapel, dan periode sudah benar.", "Data berada dalam scope akun yang aktif.", "Sesi atau record yang dibutuhkan sudah tervalidasi.") "FFF9E8" $brand.Amber
  Add-Callout $Builder "Jika data tidak sesuai" "Periksa filter, rentang tanggal, status penyimpanan, dan notifikasi error terlebih dahulu. Bila masalah berlanjut, sertakan nama halaman, waktu kejadian, serta screenshot ketika menghubungi admin." "F8FCFA" $brand.Sky
}

function StylesXml() {
  return @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="21"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="280" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="$($brand.Text)"/><w:sz w:val="21"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="260" w:after="120"/></w:pPr><w:rPr><w:b/><w:color w:val="$($brand.Primary)"/><w:sz w:val="32"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="Heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="100"/></w:pPr><w:rPr><w:b/><w:color w:val="$($brand.Primary)"/><w:sz w:val="26"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="Heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="160" w:after="80"/></w:pPr><w:rPr><w:b/><w:color w:val="$($brand.Deep)"/><w:sz w:val="23"/></w:rPr></w:style>
</w:styles>
"@
}

function NumberingXml() {
  return @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="&#8226;"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="540"/></w:tabs><w:ind w:left="540" w:hanging="270"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr></w:lvl></w:abstractNum>
  <w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="540"/></w:tabs><w:ind w:left="540" w:hanging="270"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr></w:lvl></w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
  <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>
"@
}

function HeaderXml([string]$Audience) {
  return @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="left"/><w:spacing w:after="80"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:color w:val="$($brand.Primary)"/><w:sz w:val="16"/></w:rPr><w:t>SEKOLAH CITRA NEGARA</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="$($brand.Muted)"/><w:sz w:val="16"/></w:rPr><w:t xml:space="preserve">  |  $Audience</w:t></w:r></w:p></w:hdr>
"@
}

function FooterXml() {
  return @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="80"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="$($brand.Muted)"/><w:sz w:val="16"/></w:rPr><w:t>Absensi CN - Sekolah Citra Negara  |  Halaman </w:t></w:r><w:fldSimple w:instr="PAGE"><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="$($brand.Muted)"/><w:sz w:val="16"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple></w:p></w:ftr>
"@
}

function ContentTypesXml() {
  return @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>
"@
}

function RootRelsXml() { return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>' }
function DocumentRelsXml() { return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>' }

function CoreXml([string]$Title) {
  $now = [DateTime]::UtcNow.ToString("s") + "Z"
  return "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><cp:coreProperties xmlns:cp=`"http://schemas.openxmlformats.org/package/2006/metadata/core-properties`" xmlns:dc=`"http://purl.org/dc/elements/1.1/`" xmlns:dcterms=`"http://purl.org/dc/terms/`" xmlns:xsi=`"http://www.w3.org/2001/XMLSchema-instance`"><dc:title>$(Xml $Title)</dc:title><dc:creator>Sekolah Citra Negara</dc:creator><cp:lastModifiedBy>Sekolah Citra Negara</cp:lastModifiedBy><dcterms:created xsi:type=`"dcterms:W3CDTF`">$now</dcterms:created><dcterms:modified xsi:type=`"dcterms:W3CDTF`">$now</dcterms:modified></cp:coreProperties>"
}
function AppXml() { return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Absensi CN Guidebook Builder</Application></Properties>' }

function Write-ZipText($Archive, [string]$Path, [string]$Content) {
  $entry = $Archive.CreateEntry($Path, [System.IO.Compression.CompressionLevel]::Optimal)
  $stream = $entry.Open()
  try {
    $writer = [System.IO.StreamWriter]::new($stream, [System.Text.UTF8Encoding]::new($false))
    try { $writer.Write($Content) } finally { $writer.Dispose() }
  } finally { $stream.Dispose() }
}

function New-Guidebook([string]$OutputPath, [string]$Audience, [scriptblock]$BuildContent) {
  if (Test-Path -LiteralPath $OutputPath) { Remove-Item -LiteralPath $OutputPath -Force }
  $body = [System.Text.StringBuilder]::new()
  & $BuildContent $body
  $section = "<w:sectPr><w:headerReference w:type=`"default`" r:id=`"rId3`"/><w:footerReference w:type=`"default`" r:id=`"rId4`"/><w:pgSz w:w=`"12240`" w:h=`"15840`"/><w:pgMar w:top=`"1440`" w:right=`"1440`" w:bottom=`"1440`" w:left=`"1440`" w:header=`"720`" w:footer=`"720`" w:gutter=`"0`"/></w:sectPr>"
  $documentXml = "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><w:document xmlns:w=`"http://schemas.openxmlformats.org/wordprocessingml/2006/main`" xmlns:r=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships`"><w:body>$($body.ToString())$section</w:body></w:document>"
  $archive = [System.IO.Compression.ZipFile]::Open($OutputPath, [System.IO.Compression.ZipArchiveMode]::Create)
  try {
    Write-ZipText $archive "[Content_Types].xml" (ContentTypesXml)
    Write-ZipText $archive "_rels/.rels" (RootRelsXml)
    Write-ZipText $archive "docProps/core.xml" (CoreXml $Audience)
    Write-ZipText $archive "docProps/app.xml" (AppXml)
    Write-ZipText $archive "word/document.xml" $documentXml
    Write-ZipText $archive "word/styles.xml" (StylesXml)
    Write-ZipText $archive "word/numbering.xml" (NumberingXml)
    Write-ZipText $archive "word/header1.xml" (HeaderXml $Audience)
    Write-ZipText $archive "word/footer1.xml" (FooterXml)
    Write-ZipText $archive "word/_rels/document.xml.rels" (DocumentRelsXml)
  } finally { $archive.Dispose() }
}

$studentOutput = Join-Path $outputRoot "Guidebook Siswa - Absensi CN - Sekolah Citra Negara - Edisi 2.docx"
$staffOutput = Join-Path $outputRoot "Guidebook Guru Walas Mapel dan BK - Absensi CN - Sekolah Citra Negara - Edisi 2.docx"

New-Guidebook $studentOutput "Guidebook Portal Siswa - Edisi 2" { param($builder) Add-StudentGuideV2 $builder }
New-Guidebook $staffOutput "Guidebook Portal Staff - Edisi 2" { param($builder) Add-StaffGuideV2 $builder }

Get-Item -LiteralPath $studentOutput, $staffOutput | Select-Object FullName, Length
