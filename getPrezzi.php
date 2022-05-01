<?php

$prices = 'https://www.mise.gov.it/images/exportCSV/prezzo_alle_8.csv';
$filePrices = '/tmp/'.md5($prices).'.csv';

$stations = 'https://www.mise.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv';
$fileStations = '/tmp/'.md5($stations).'.csv';
$dbPath = '/home/cri/Cloud/Progetti/oilPrice';

function downladFile($url): int{
    print_r("DOWNLOADING FILE\n");
    $filePath = '/tmp/'.md5($url).'.csv';
    $opt = [
        CURLOPT_FILE => fopen($filePath,'w'),
        CURLOPT_TIMEOUT => 12000,
        CURLOPT_URL => $url
    ];

    $call = curl_init();
    curl_setopt_array($call, $opt);
    curl_exec($call);
    return curl_getinfo($call, CURLINFO_HTTP_CODE);
}

function deleteFile($url): void{
    $filePath = '/tmp/'.md5($url).'.csv';
    if(is_file($filePath))
        unlink($filePath);
}

function csvToArray($filePath,$separator="\"", $linesToSkip=0): array{
    $csv = explode("\n",file_get_contents($filePath));
    if($linesToSkip > 0){
        $csv = array_slice($csv,$linesToSkip);
    }
    $keys = explode($separator,$csv[0]);
    $csv = array_slice($csv,1);
    $map = [];
    foreach($csv as $line){
        $elements = explode($separator, $line);
        $res = [];
        for($i = 0; $i < count($elements); $i++)
            $res[$keys[$i]] = $elements[$i];
        $map[] = $res;
    }
    //print_r($map);
    return $map;
}

function parseDate($date): string{
    $parsed = DateTime::createFromFormat('d/m/Y H:i:s',$date);
    return $parsed ? $parsed->format('Y-m-d H:i:s') : '';
}

function loadOnDB($data, $table){
    if($table != 'prices' && $table != 'stations')
        die();

    $dbPath = '/home/cri/Cloud/Progetti/oilPrice/prices.db';
    $db = new SQLite3($dbPath);

    $values = [];
    foreach($data as $d){
        if($table == 'prices')
            $values[] = sprintf("(%s,'%s',%s,%s,'%s')",$d['idImpianto'],$d['descCarburante'],$d['prezzo'],$d['isSelf'],parseDate($d['dtComu']));
        elseif($table == 'stations')
            $values[] = sprintf("(%s,'%s','%s','%s','%s','%s','%s','%s','%s','%s')",
                $d['idImpianto'],
                str_replace(['"',"'"], "",$d['Gestore'] ?? ''),
                $d['Bandiera'] ?? '',
                str_replace(['"',"'"], "",$d['Tipo Impianto'] ?? ''),
                str_replace(['"',"'"], "",$d['Nome Impianto'] ?? ''),
                str_replace(['"',"'"], "",$d['Indirizzo'] ?? ''),
                str_replace(['"',"'"], "",$d['Comune'] ?? ''),
                $d['Provincia'] ?? '',
                $d['Latitudine'] ?? '',
                $d['Longitudine'] ?? '',
            );
        
    }

    unset($values[count($values)-1]);
    $db->prepare("DELETE FROM $table")->execute(); //Empty table
    $query = sprintf("INSERT INTO $table VALUES %s",implode(",",$values));
    file_put_contents('/tmp/query',$query);
    
    $q = $db->prepare($query);
    $res = $q->execute();
    $r = [];
    while($row = $res->fetchArray(SQLITE3_ASSOC))
        $r[] = $row;

}

$datePrices = downladFile($prices);
if($datePrices == 200){
    $csv = csvToArray($filePrices,";",1);
    loadOnDB($csv, 'prices');
    deleteFile($filePrices);
}

$dataStations = downladFile($stations);
if($dataStations == 200){
    $csv = csvToArray($fileStations,";",1);
    loadOnDB($csv, 'stations');
    deleteFile($fileStations);
}