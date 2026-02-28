<?php
require_once '../config/db.php';
$raw=$data=[];
$raw=file_get_contents('php://input');
$data=json_decode($raw,true)?:[];
$action=$data['action']??$_GET['action']??$_POST['action']??'';
switch($action){
    case 'register':      doRegister($data);     break;
    case 'login':         doLogin($data);        break;
    case 'logout':        doLogout();            break;
    case 'check':         doCheck();             break;
    case 'request_reset': requestReset($data);   break;
    case 'do_reset':      doReset($data);        break;
    case 'careers':       getCareers();          break;
    case 'create_career': createCareer($data);   break;
    case 'delete_career': deleteCareer($data);   break;
    case 'rename_career': renameCareer($data);   break;
    default: echo json_encode(['error'=>'Azione non trovata: '.$action]);
}

function doRegister($data){
    $db=getDB();
    $email=strtolower(trim($data['email']??''));
    $password=$data['password']??'';
    if(!$email||!$password){echo json_encode(['error'=>'Email e password obbligatorie']);return;}
    if(!filter_var($email,FILTER_VALIDATE_EMAIL)){echo json_encode(['error'=>'Email non valida']);return;}
    if(strlen($password)<6){echo json_encode(['error'=>'Password min 6 caratteri']);return;}
    try{
        $db->prepare("INSERT INTO accounts (email,password) VALUES(?,?)")->execute([$email,password_hash($password,PASSWORD_DEFAULT)]);
        $account_id=(int)$db->lastInsertId();
        $token=createAccountToken($db,$account_id);
        echo json_encode(['success'=>true,'token'=>$token,'account_id'=>$account_id,'email'=>$email,'careers'=>[]]);
    }catch(PDOException $e){
        if(strpos($e->getMessage(),'UNIQUE')!==false) echo json_encode(['error'=>'Email già registrata']);
        else echo json_encode(['error'=>'Errore: '.$e->getMessage()]);
    }
}

function doLogin($data){
    $db=getDB();
    $email=strtolower(trim($data['email']??''));
    $password=$data['password']??'';
    if(!$email||!$password){echo json_encode(['error'=>'Inserisci email e password']);return;}
    $stmt=$db->prepare("SELECT * FROM accounts WHERE email=?");
    $stmt->execute([$email]);
    $account=$stmt->fetch();
    if(!$account||!password_verify($password,$account['password'])){echo json_encode(['error'=>'Email o password non corretti']);return;}
    $token=createAccountToken($db,$account['id']);
    $careers=getCareerList($db,$account['id']);
    echo json_encode(['success'=>true,'token'=>$token,'account_id'=>$account['id'],'email'=>$account['email'],'careers'=>$careers]);
}

function doLogout(){
    $token=getToken();
    if($token){$db=getDB();$db->prepare("DELETE FROM account_tokens WHERE token=?")->execute([$token]);}
    echo json_encode(['success'=>true]);
}

function doCheck(){
    $token=getToken();
    if(!$token){echo json_encode(['logged'=>false]);return;}
    $db=$stmt=null;$db=getDB();
    $stmt=$db->prepare("SELECT account_id FROM account_tokens WHERE token=? AND expires_at > datetime('now')");
    $stmt->execute([$token]);
    $row=$stmt->fetch();
    if(!$row){echo json_encode(['logged'=>false]);return;}
    $careers=getCareerList($db,$row['account_id']);
    echo json_encode(['logged'=>true,'account_id'=>$row['account_id'],'careers'=>$careers]);
}

function requestReset($data){
    $db=getDB();
    $email=strtolower(trim($data['email']??''));
    if(!$email){echo json_encode(['error'=>'Inserisci la tua email']);return;}
    $stmt=$db->prepare("SELECT id FROM accounts WHERE email=?");
    $stmt->execute([$email]);
    $account=$stmt->fetch();
    if(!$account){echo json_encode(['success'=>true,'msg'=>"Se l'email esiste riceverai le istruzioni."]);return;}
    $token=bin2hex(random_bytes(20));
    $expires=date('Y-m-d H:i:s',strtotime('+1 hour'));
    $db->prepare("INSERT INTO password_resets (account_id,token,expires_at) VALUES(?,?,?)")->execute([$account['id'],$token,$expires]);
    // Supporto Codespaces (X-Forwarded-Host) e Docker/proxy
    $host = $_SERVER['HTTP_X_FORWARDED_HOST']
         ?? $_SERVER['HTTP_X_FORWARDED_SERVER']
         ?? $_SERVER['HTTP_HOST']
         ?? 'localhost:8080';
    // Rimuovi porta se presente e c'è un proxy (Codespaces usa HTTPS senza porta)
    $scheme = (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']))
              ? $_SERVER['HTTP_X_FORWARDED_PROTO']
              : ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http');
    $link="{$scheme}://{$host}/frontend/reset.html?token={$token}";
    $sent = sendGmailSMTP(
        $email,
        "Reset Password Golden Striker ⚽",
        "Ciao!\n\nHai richiesto il reset della password per il tuo account Golden Striker.\n\nClicca il link qui sotto (valido 1 ora):\n{$link}\n\nSe non hai richiesto nulla, ignora questa email.\n\nBuona fortuna in campo! ⚽\nGolden Striker"
    );
    echo json_encode(['success'=>true,'msg'=>'Istruzioni inviate via email!','debug_link'=>$link,'mail_sent'=>$sent]);
}

/**
 * Invia email tramite Gmail usando PHPMailer (se disponibile)
 * oppure SMTP nativo con STARTTLS, oppure mail() come fallback finale.
 *
 * NOTA: Per far funzionare Gmail devi abilitare "App Password" sul tuo account Google:
 *   1. Vai su myaccount.google.com > Sicurezza > Verifica in 2 passaggi (attiva)
 *   2. Poi cerca "Password per le app" e crea una password per "Posta"
 *   3. Sostituisci $fromPass qui sotto con quella password a 16 caratteri
 */
function sendGmailSMTP($to, $subject, $body) {
    $from     = 'goldenstrikerreset@gmail.com';
    $fromPass = 'rqma hcgx amhg obcy'; // <-- Sostituisci con App Password Google (16 char)
    $fromName = 'Golden Striker';

    // --- Prova PHPMailer se presente ---
    $phpmailerPath = __DIR__ . '/../../vendor/PHPMailer/src/PHPMailer.php';
    if (file_exists($phpmailerPath)) {
        require_once $phpmailerPath;
        require_once __DIR__ . '/../../vendor/PHPMailer/src/SMTP.php';
        require_once __DIR__ . '/../../vendor/PHPMailer/src/Exception.php';
        try {
            $mail = new PHPMailer\PHPMailer\PHPMailer(true);
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = $from;
            $mail->Password   = $fromPass;
            $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;
            $mail->CharSet    = 'UTF-8';
            $mail->setFrom($from, $fromName);
            $mail->addAddress($to);
            $mail->Subject = $subject;
            $mail->Body    = $body;
            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log('PHPMailer error: ' . $e->getMessage());
        }
    }

    // --- Fallback: SMTP nativo con STARTTLS ---
    $sent = sendRawSMTP($from, $fromPass, $fromName, $to, $subject, $body);
    if ($sent) return true;

    // --- Fallback finale: mail() ---
    $headers  = "From: {$fromName} <{$from}>\r\n";
    $headers .= "Reply-To: {$from}\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: base64\r\n";
    return @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', chunk_split(base64_encode($body)), $headers);
}

function sendRawSMTP($from, $pass, $fromName, $to, $subject, $body) {
    $errno = $errstr = '';
    $socket = @stream_socket_client('tcp://smtp.gmail.com:587', $errno, $errstr, 15);
    if (!$socket) return false;

    stream_set_timeout($socket, 15);

    $read = function() use ($socket) {
        $out = '';
        while (!feof($socket)) {
            $line = fgets($socket, 1024);
            if (!$line) break;
            $out .= $line;
            if (strlen($line) >= 4 && $line[3] === ' ') break;
        }
        return $out;
    };
    $cmd = function($c) use ($socket) { fputs($socket, $c . "\r\n"); };

    $banner = $read();
    if (strpos($banner, '220') === false) { fclose($socket); return false; }

    $cmd('EHLO localhost'); $read();
    $cmd('STARTTLS');
    $tls = $read();
    if (strpos($tls, '220') === false) { fclose($socket); return false; }

    if (!stream_socket_enable_crypto($socket, true,
        STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_1_CLIENT)) {
        fclose($socket); return false;
    }

    $cmd('EHLO localhost'); $read();
    $cmd('AUTH LOGIN'); $read();
    $cmd(base64_encode($from)); $read();
    $cmd(base64_encode($pass));
    $auth = $read();
    if (strpos($auth, '235') === false) { fclose($socket); return false; }

    $cmd("MAIL FROM:<{$from}>"); $read();
    $cmd("RCPT TO:<{$to}>"); $read();
    $cmd('DATA'); $read();

    $msg  = "From: {$fromName} <{$from}>\r\n";
    $msg .= "To: {$to}\r\n";
    $msg .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
    $msg .= "MIME-Version: 1.0\r\n";
    $msg .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $msg .= "Content-Transfer-Encoding: base64\r\n";
    $msg .= "\r\n";
    $msg .= chunk_split(base64_encode($body));
    $msg .= "\r\n.";

    $cmd($msg);
    $resp = $read();
    $cmd('QUIT');
    fclose($socket);
    return strpos($resp, '250') !== false;
}

function doReset($data){
    $db=getDB();
    $token=trim($data['token']??'');
    $password=trim($data['password']??'');
    if(!$token||!$password){echo json_encode(['error'=>'Dati mancanti']);return;}
    if(strlen($password)<6){echo json_encode(['error'=>'Password min 6 caratteri']);return;}
    $stmt=$db->prepare("SELECT * FROM password_resets WHERE token=? AND expires_at > datetime('now') AND used=0");
    $stmt->execute([$token]);
    $reset=$stmt->fetch();
    if(!$reset){echo json_encode(['error'=>'Link non valido o scaduto']);return;}
    $db->prepare("UPDATE accounts SET password=? WHERE id=?")->execute([password_hash($password,PASSWORD_DEFAULT),$reset['account_id']]);
    $db->prepare("UPDATE password_resets SET used=1 WHERE id=?")->execute([$reset['id']]);
    echo json_encode(['success'=>true,'msg'=>'Password aggiornata! Puoi ora accedere.']);
}

function getCareers(){
    $account_id=getAuthAccountId();
    if(!$account_id){echo json_encode(['error'=>'Non autenticato']);return;}
    $db=getDB();
    echo json_encode(getCareerList($db,$account_id));
}

function getCareerList($db,$account_id){
    $stmt=$db->prepare("SELECT p.id,p.career_name,p.player_name,p.gender,p.age,p.overall,p.mese_corrente,p.anno_corrente,p.palloni_doro,p.trofei,p.gol_carriera,p.skin_hair,p.skin_color,p.eye_color,t.nome as team_nome,l.nome as lega_nome FROM players p LEFT JOIN teams t ON p.team_id=t.id LEFT JOIN leghe l ON t.lega_id=l.id WHERE p.account_id=? ORDER BY p.created_at DESC");
    $stmt->execute([$account_id]);
    return $stmt->fetchAll();
}

function createCareer($data){
    $account_id=getAuthAccountId();
    if(!$account_id){echo json_encode(['error'=>'Non autenticato']);return;}
    $db=getDB();
    $cnt=$db->prepare("SELECT COUNT(*) as c FROM players WHERE account_id=?");
    $cnt->execute([$account_id]);
    if($cnt->fetch()['c']>=5){echo json_encode(['error'=>'Massimo 5 carriere']);return;}
    $career_name=trim($data['career_name']??'Nuova Carriera');
    $player_name=trim($data['player_name']??'');
    $gender=$data['gender']??'male';
    $nationality=$data['nationality']??'Italy';
    $age=intval($data['age']??17);
    $skin_hair=$data['skin_hair']??'short_black';
    $skin_color=$data['skin_color']??'medium';
    $eye_color=$data['eye_color']??'brown';
    if(!$player_name){echo json_encode(['error'=>'Inserisci il nome del calciatore']);return;}
    if($age<16||$age>19){echo json_encode(['error'=>'Età non valida']);return;}
    $leghe=$db->query("SELECT id FROM leghe WHERE livello=2")->fetchAll();
    $lega=$leghe[array_rand($leghe)];
    $stmt=$db->prepare("SELECT id FROM teams WHERE lega_id=? ORDER BY ovr ASC LIMIT 9");
    $stmt->execute([$lega['id']]);
    $squadre=$stmt->fetchAll();
    $team_id=!empty($squadre)?$squadre[array_rand($squadre)]['id']:1;
    $overall=rand(50,56);
    $db->prepare("INSERT INTO players (account_id,career_name,player_name,gender,nationality,age,overall,tiro,velocita,dribbling,fisico,mentalita,team_id,skin_hair,skin_color,eye_color) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")->execute([$account_id,$career_name,$player_name,$gender,$nationality,$age,$overall,rand(45,56),rand(45,56),rand(45,56),rand(45,56),rand(45,56),$team_id,$skin_hair,$skin_color,$eye_color]);
    $career_id=(int)$db->lastInsertId();
    echo json_encode(['success'=>true,'career_id'=>$career_id,'careers'=>getCareerList($db,$account_id)]);
}

function deleteCareer($data){
    $account_id=getAuthAccountId();
    if(!$account_id){echo json_encode(['error'=>'Non autenticato']);return;}
    $db=getDB();
    $cid=intval($data['career_id']??0);
    $stmt=$db->prepare("SELECT id FROM players WHERE id=? AND account_id=?");
    $stmt->execute([$cid,$account_id]);
    if(!$stmt->fetch()){echo json_encode(['error'=>'Carriera non trovata']);return;}
    foreach(['log_mensile','stagioni','agente','notizie','obiettivi'] as $tbl){
        try{$db->prepare("DELETE FROM {$tbl} WHERE player_id=?")->execute([$cid]);}catch(Exception $e){}
    }
    $db->prepare("DELETE FROM players WHERE id=?")->execute([$cid]);
    echo json_encode(['success'=>true,'careers'=>getCareerList($db,$account_id)]);
}

function renameCareer($data){
    $account_id=getAuthAccountId();
    if(!$account_id){echo json_encode(['error'=>'Non autenticato']);return;}
    $db=getDB();
    $cid=intval($data['career_id']??0);
    $name=trim($data['name']??'');
    if(!$name){echo json_encode(['error'=>'Nome non valido']);return;}
    $db->prepare("UPDATE players SET career_name=? WHERE id=? AND account_id=?")->execute([$name,$cid,$account_id]);
    echo json_encode(['success'=>true,'careers'=>getCareerList($db,$account_id)]);
}

function createAccountToken($db,$account_id){
    $db->prepare("DELETE FROM account_tokens WHERE account_id=?")->execute([$account_id]);
    $token=generateToken();
    $expires=date('Y-m-d H:i:s',strtotime('+30 days'));
    $db->prepare("INSERT INTO account_tokens (account_id,token,expires_at) VALUES(?,?,?)")->execute([$account_id,$token,$expires]);
    return $token;
}
