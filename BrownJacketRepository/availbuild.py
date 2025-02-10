import json
import boto3

def build_avail_table(nickname, dates):
    
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('BrownJacketAvailability2024')

    response = table.put_item(

        Item={
            'nickname': nickname,
            'dates': dates 
            })
        
    return {
        'statusCode': 200,
        'body': json.dumps(nickname)
        }

if __name__ == '__main__':
    with open("BrownJacketRepository/players.json") as json_file:
        member_list = json.load(json_file)
    print("Player json file successfully loaded.")
    plength = len(member_list['members'])
    print("There are", plength, "players this year.")
    i = 0
    while i < plength:
        print("Starting with Player",i,":",member_list['members'][i]['nickname'])
        nickname = member_list['members'][i]['nickname']
        dates = ["-","-","-","-","-","-","-","-","-","-",
            "-","-","-","-","-","-","-","-","-","-",
            "-","-","-","-","-","-","-","-","-","-","-","-","-","-","-","-","-","-",
            "-","-","-","-","-","-","-",
            "-","-","-","-","-","-","-","-"]
        
        avail_resp = build_avail_table(nickname, dates)
        print("Write availability succeeded for :", nickname)
        i += 1