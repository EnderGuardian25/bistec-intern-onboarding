sequenceDiagram
    autonumber
    actor U as Claimant (mobile)
    participant FE as Web application
    participant API as Claims API
    participant DB as Azure SQL
    participant BLOB as Blob Storage
    participant SB as Service Bus
    participant TEAMS as Teams webhook
    actor MGR as Line Manager (Teams)

U ->> FE : Tap "Submit Claim"
FE ->> API : POST /claims (JWT)
API ->> DB : INSERT Claim (status=Submitted)

activate API
API ->> BLOB : Upload receipts

alt Receipt Upload Succeeds [Happy Path]
    BLOB -->> API : 201 Created (Asset Keys)
    API->> SB: Publish claim.submitted
    deactivate API

    activate SB
    SB -->> TEAMS : Adaptive card to manager
    deactivate SB
        
    TEAMS -->> MGR : Notification
        
    MGR ->> API : POST /claims/{id}/approve (JWT)
    activate API
    API ->> DB : UPDATE status=Approved + audit row
    API-->> MGR : 200 OK
    deactivate API

else Reciept Upload Fails [Error Path]
    BLOB -->> API : 500 Internal Error / Connection Timeout
    API ->> DB : UPDATE status=Draft + reason="upload_failed"
    API -->> FE : 502 Bad Gateway with retry-after

end