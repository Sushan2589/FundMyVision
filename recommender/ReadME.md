Execute this code to run the API endpoint

Open a virtual environment if on Linux

Execute : pip install -r requirements.txt

Execute : uvicorn main:app --reload --port 8000

Goto : "https://...:8000/recommend/{investor_id}"


Returns JSON
{
    "investor_id" : investor_id,
    "idea_ids" : { 1, 2, 3 ,...}
}

Returned ids are sorted. The idea with the highest match is at the front and with the lowest match is at the last. Use however many ideas are needed to be displayed.


