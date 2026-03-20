<?php
require_once '../config/db.php';

// Cattura errori fatali e restituisce JSON invece di HTML
set_exception_handler(function($e) {
    http_response_code(500);
    echo json_encode(['error' => 'Errore server: ' . $e->getMessage() . ' (L.' . $e->getLine() . ')']);
    exit;
});
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
});
$data = _getCachedBody();
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
    case 'send_update_request': sendUpdateRequest($data); break;
    default: echo json_encode([t('Errore: azione non trovata','Error: action not found').': '.$action]);
}

function doRegister($data){
    $db=getDB();
    $email=strtolower(trim($data['email']??''));
    $username=trim($data['username']??'');
    $password=$data['password']??'';
    if(!$email||!$password||!$username){echo json_encode(['error'=>t('Email, username e password obbligatori','Email, username and password are required')]);return;}
    if(!filter_var($email,FILTER_VALIDATE_EMAIL)){echo json_encode(['error'=>t('Email non valida','Invalid email address')]);return;}
    if(strlen($password)<6){echo json_encode(['error'=>t('Password min 6 caratteri','Password must be at least 6 characters')]);return;}
    if(strlen($username)<3||strlen($username)>30){echo json_encode(['error'=>t('Username deve essere tra 3 e 30 caratteri','Username must be between 3 and 30 characters')]);return;}
    if(!preg_match('/^[a-zA-Z0-9_]+$/',$username)){echo json_encode(['error'=>t('Username può contenere solo lettere, numeri e underscore','Username can only contain letters, numbers and underscores')]);return;}
    try{
        $db->prepare("INSERT INTO accounts (email,username,password) VALUES(?,?,?)")->execute([$email,$username,password_hash($password,PASSWORD_DEFAULT)]);
        $account_id=(int)$db->lastInsertId();
        $token=createAccountToken($db,$account_id);
        echo json_encode(['success'=>true,'token'=>$token,'account_id'=>$account_id,'email'=>$email,'username'=>$username,'careers'=>[]]);
    }catch(PDOException $e){
        if(strpos($e->getMessage(),'UNIQUE')!==false){
            if(strpos($e->getMessage(),'email')!==false) echo json_encode(['error'=>t('Email già registrata','Email already registered')]);
            else echo json_encode(['error'=>t('Username già in uso','Username already taken')]);
        }
        else echo json_encode(['error'=>'Errore: '.$e->getMessage()]);
    }
}

function doLogin($data){
    $db=getDB();
    $email=strtolower(trim($data['email']??''));
    $password=$data['password']??'';
    if(!$email||!$password){echo json_encode(['error'=>t('Inserisci email e password','Please enter your email and password')]);return;}
    $stmt=$db->prepare("SELECT * FROM accounts WHERE email=?");
    $stmt->execute([$email]);
    $account=$stmt->fetch();
    if(!$account||!password_verify($password,$account['password'])){echo json_encode(['error'=>t('Email o password non corretti','Email or password is incorrect')]);return;}
    $token=createAccountToken($db,$account['id']);
    $careers=getCareerList($db,$account['id']);
    echo json_encode(['success'=>true,'token'=>$token,'account_id'=>$account['id'],'email'=>$account['email'],'username'=>$account['username']??$account['email'],'careers'=>$careers]);
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
    if(!$email){echo json_encode(['error'=>t('Inserisci la tua email','Please enter your email')]);return;}
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
    if(!$token||!$password){echo json_encode(['error'=>t('Dati mancanti','Missing data')]);return;}
    if(strlen($password)<6){echo json_encode(['error'=>t('Password min 6 caratteri','Password must be at least 6 characters')]);return;}
    $stmt=$db->prepare("SELECT * FROM password_resets WHERE token=? AND expires_at > datetime('now') AND used=0");
    $stmt->execute([$token]);
    $reset=$stmt->fetch();
    if(!$reset){echo json_encode(['error'=>t('Link non valido o scaduto','Invalid or expired link')]);return;}
    $db->prepare("UPDATE accounts SET password=? WHERE id=?")->execute([password_hash($password,PASSWORD_DEFAULT),$reset['account_id']]);
    $db->prepare("UPDATE password_resets SET used=1 WHERE id=?")->execute([$reset['id']]);
    echo json_encode(['success'=>true,'msg'=>'Password aggiornata! Puoi ora accedere.']);
}

function getCareers(){
    $account_id=getAuthAccountId();
    if(!$account_id){echo json_encode(['error'=>t('Non autenticato','Not authenticated')]);return;}
    $db=getDB();
    echo json_encode(getCareerList($db,$account_id));
}

function getCareerList($db,$account_id){
    $stmt=$db->prepare("SELECT p.id,p.career_name,p.player_name,p.gender,p.age,p.overall,p.mese_corrente,p.anno_corrente,p.palloni_doro,p.trofei,p.gol_carriera,p.skin_hair,p.skin_color,p.eye_color,p.hair_color,p.ai_avatar,p.ai_prompt,t.nome as team_nome,l.nome as lega_nome FROM players p LEFT JOIN teams t ON p.team_id=t.id LEFT JOIN leghe l ON t.lega_id=l.id WHERE p.account_id=? ORDER BY p.created_at DESC");
    $stmt->execute([$account_id]);
    return $stmt->fetchAll();
}

function createCareer($data){
    $account_id=getAuthAccountId();
    if(!$account_id){echo json_encode(['error'=>t('Non autenticato','Not authenticated')]);return;}
    $db=getDB();
    $cnt=$db->prepare("SELECT COUNT(*) as c FROM players WHERE account_id=?");
    $cnt->execute([$account_id]);
    if($cnt->fetch()['c']>=5){echo json_encode(['error'=>t('Massimo 5 carriere','Maximum 5 careers allowed')]);return;}
    $career_name=trim($data['career_name']??'Nuova Carriera');
    $player_name=trim($data['player_name']??'');
    $gender=$data['gender']??'male';
    $nationality=$data['nationality']??'Italy';
    $age=intval($data['age']??17);
    $skin_hair=$data['skin_hair']??'short_black';
    $skin_color=$data['skin_color']??'medium';
    $eye_color=$data['eye_color']??'brown';
    $hair_color=$data['hair_color']??'#1a1a1a';
    $ai_avatar=$data['ai_avatar']??null;
    $ai_prompt=$data['ai_prompt']??null;  // prompt testuale Pollinations.ai
    // Piede: livello fisso, solo il lato viene scelto dal giocatore
    $piede_forte_lato=in_array($data['piede_forte_lato']??'dx',['dx','sx'])?($data['piede_forte_lato']??'dx'):'dx';
    $piede_debole_lato=in_array($data['piede_debole_lato']??'sx',['dx','sx'])?($data['piede_debole_lato']??'sx'):'sx';
    if($piede_forte_lato===$piede_debole_lato){echo json_encode(['error'=>t('Il piede forte e debole devono essere diversi','Strong and weak foot must be different')]);return;}
    $piede_forte=3; // livello fisso di partenza
    $piede_debole=2; // livello fisso di partenza
    if(!$player_name){echo json_encode(['error'=>t('Inserisci il nome del calciatore','Please enter the player name')]);return;}
    if($age<16||$age>22){echo json_encode(['error'=>t('Età non valida','Invalid age')]);return;}

    // Ruolo scelto → bonus +5 alla stat principale
    $role = in_array($data['role']??'', ['bomber','fantasista','ala','regista','tuttocampista'])
        ? ($data['role']) : 'bomber';
    $base = 50;
    $tiro      = rand($base-5,$base+5);
    $velocita  = rand($base-5,$base+5);
    $dribbling = rand($base-5,$base+5);
    $fisico    = rand($base-5,$base+5);
    $mentalita = rand($base-5,$base+5);
    switch($role){
        case 'bomber':        $tiro      += 5; break;
        case 'fantasista':    $dribbling += 5; break;
        case 'ala':           $velocita  += 5; break;
        case 'regista':       $mentalita += 5; break;
        case 'tuttocampista': $fisico    += 5; break;
    }
    $overall = intval(($tiro+$velocita+$dribbling+$fisico+$mentalita)/5);

    $leghe=$db->query("SELECT id FROM leghe WHERE livello=2")->fetchAll();
    $lega=$leghe[array_rand($leghe)];
    $stmt=$db->prepare("SELECT id FROM teams WHERE lega_id=? ORDER BY ovr ASC LIMIT 9");
    $stmt->execute([$lega['id']]);
    $squadre=$stmt->fetchAll();
    $team_id=!empty($squadre)?$squadre[array_rand($squadre)]['id']:1;

    $db->prepare("INSERT INTO players (account_id,career_name,player_name,gender,nationality,age,overall,tiro,velocita,dribbling,fisico,mentalita,team_id,skin_hair,skin_color,eye_color,hair_color,ai_avatar,ai_prompt,piede_forte,piede_debole,livello_skill,piede_forte_lato,piede_debole_lato,mese_corrente) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")->execute([$account_id,$career_name,$player_name,$gender,$nationality,$age,$overall,$tiro,$velocita,$dribbling,$fisico,$mentalita,$team_id,$skin_hair,$skin_color,$eye_color,$hair_color,$ai_avatar,$ai_prompt,$piede_forte,$piede_debole,2,$piede_forte_lato,$piede_debole_lato,9]);
    $career_id=(int)$db->lastInsertId();
    echo json_encode(['success'=>true,'career_id'=>$career_id,'careers'=>getCareerList($db,$account_id)]);
}

function deleteCareer($data){
    $account_id=getAuthAccountId();
    if(!$account_id){echo json_encode(['error'=>t('Non autenticato','Not authenticated')]);return;}
    $db=getDB();
    $cid=intval($data['career_id']??0);
    $stmt=$db->prepare("SELECT id FROM players WHERE id=? AND account_id=?");
    $stmt->execute([$cid,$account_id]);
    if(!$stmt->fetch()){echo json_encode(['error'=>t('Carriera non trovata','Career not found')]);return;}
    foreach(['log_mensile','stagioni','agente','notizie','obiettivi','skill_boosts'] as $tbl){
        try{$db->prepare("DELETE FROM {$tbl} WHERE player_id=?")->execute([$cid]);}catch(Exception $e){}
    }
    // champions_cup è collegata al team_id del giocatore, non al player_id
    try {
        $team_stmt = $db->prepare("SELECT team_id, anno_corrente FROM players WHERE id=?");
        $team_stmt->execute([$cid]);
        $career_row = $team_stmt->fetch();
        if ($career_row) {
            $db->prepare("DELETE FROM champions_cup WHERE team_id=? AND anno=?")
               ->execute([$career_row['team_id'], $career_row['anno_corrente']]);
        }
    } catch(Exception $e) {}
    $db->prepare("DELETE FROM players WHERE id=?")->execute([$cid]);
    echo json_encode(['success'=>true,'careers'=>getCareerList($db,$account_id)]);
}

function renameCareer($data){
    $account_id=getAuthAccountId();
    if(!$account_id){echo json_encode(['error'=>t('Non autenticato','Not authenticated')]);return;}
    $db=getDB();
    $cid=intval($data['career_id']??0);
    $name=trim($data['name']??'');
    if(!$name){echo json_encode(['error'=>t('Nome non valido','Invalid name')]);return;}
    $db->prepare("UPDATE players SET career_name=? WHERE id=? AND account_id=?")->execute([$name,$cid,$account_id]);
    echo json_encode(['success'=>true,'careers'=>getCareerList($db,$account_id)]);
}

function sendUpdateRequest($data){
    $account_id=getAuthAccountId();
    if(!$account_id){echo json_encode(['error'=>t('Non autenticato','Not authenticated')]);return;}
    $db=getDB();
    $msg=trim($data['message']??'');
    if(strlen($msg)<10){echo json_encode(['error'=>t('Messaggio troppo corto','Message too short')]);return;}
    // Recupera email account
    $stmt=$db->prepare("SELECT email FROM accounts WHERE id=?");
    $stmt->execute([$account_id]);
    $account=$stmt->fetch();
    $user_email=$account?$account['email']:'sconosciuto';
    $subject="[Golden Striker] Richiesta Update da {$user_email}";
    $body="Richiesta di update ricevuta da: {$user_email}\n\n---\n{$msg}\n---\n\nInviata automaticamente da Golden Striker.";
    $sent=sendGmailSMTP('goldenstrikerreset@gmail.com',$subject,$body);
    echo json_encode(['success'=>true,'sent'=>$sent]);
}

function createAccountToken($db,$account_id){
    $db->prepare("DELETE FROM account_tokens WHERE account_id=?")->execute([$account_id]);
    $token=generateToken();
    $expires=date('Y-m-d H:i:s',strtotime('+30 days'));
    $db->prepare("INSERT INTO account_tokens (account_id,token,expires_at) VALUES(?,?,?)")->execute([$account_id,$token,$expires]);
    return $token;
}
