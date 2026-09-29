=== prologue ===
>>> chapter "Prologue" "Sails at Dawn · 18 May 1565"
>>> stage p0-zejtun
>>> actor ninu 3 4 east
>>> actor pawlu 5 4 west
BALBI: I kept a diary through that summer. Most of it is powder, prayers and the names of the dead. But it begins, as Maltese stories do, with the sea.
Dawn over the terraced fields of Żejtun. Below the ridge, the bay of Marsaxlokk lies still as a sheet of tin.
PAWLU: Up before the cockerel again. Your mother would have tied you to the bed.
NINU: The militia drills at first light. The captain says every man who can lift a pike is needed.
PAWLU: You have a fisherman's hands and a farmer's back. That does not make a soldier.
NINU: Then give me the chance to find out! The Knights have been hauling stone for a year. Everyone knows the Turk is coming.
PAWLU: I know it better than anyone. Three years I pulled an oar on a corsair galley, chained to the bench beside men who never saw land again.
PAWLU: War does not care how brave you are, Ninu.
He reaches out and tucks a cord back inside Ninu's shirt. On it hangs half of a broken bronze medallion.
PAWLU: And keep that hidden. Whatever happens.
NINU: This old half-coin? You've told me that since I could walk. Will you ever tell me why?
PAWLU: When you are older.
NINU: I am twenty-three!
>>> actor villager 1 1 south
VILLAGER: Sails! Sails off Delimara! Hundreds of them!
>>> actor ninu 3 4 north
They come round the point like a forest walking on the water: galleys, galliots, round ships, more than anyone can count.
PAWLU: God preserve us. They are making for the bay.
* [Run for the militia muster]
    ~ obeyed_orders += 1
    NINU: The muster bell will be ringing. I'm going.
    PAWLU: Ninu!
* [Help Pawlu get the village moving inland first]
    ~ helped_village = true
    NINU: Get the neighbours on the Birgu road. I'll carry the Grech children if I have to.
    PAWLU: Good lad. Then go to your captain. Go!
- >>> exit villager
By mid-morning the first boats are nosing onto the beach below. With them come shapes taller than any man: iron-shod war-harnesses, the Armature, stepping ashore through the surf.
>>> stage b1-marsaxlokk
>>> actor ninu 5 7 north
>>> actor ganni 4 8 north
>>> actor rozi 6 8 north
ĠANNI: Ninu! Over here! They gave us the old Ħaddiem frames from the watch tower. The springs are rusty but they walk.
ROŻI: They walk and they shoot, if you're patient. Wind yours tight, fisherman.
NINU: How many are coming up the beach?
ROŻI: Three. A pair of corsair skirmishers and a Yeniçeri with a long gun. Scouts, the captain thinks.
ĠANNI: Then we send them back to the boats.
NINU: Stay together. Use the high ground, and don't let them get behind you.
>>> join ninu
>>> join ganni
>>> join rozi
>>> battle b1-marsaxlokk
-> after_marsaxlokk

= after_marsaxlokk
>>> stage b1-marsaxlokk
>>> actor ninu 5 6 north
>>> actor ganni 4 7 north
>>> actor rozi 6 7 north
The scouts fall back to the surf. For a moment the shore is quiet except for the ticking of cooling springs.
ĠANNI: We did it. We actually did it!
ROŻI: Three scouts. Look at the bay, Ġanni. There are thirty thousand more behind them.
NINU: Pa. I have to find Pa.
-> the_taking

= the_taking
>>> stage p0-zejtun
>>> actor ninu 2 5 north
The farmhouse door hangs open. The table is overturned, and there are boot prints in the flour on the floor, too deep for a man.
{helped_village:
    NINU: The neighbours got away. I saw them on the road. But Pa stayed behind to shut the gates...
- else:
    NINU: Pa? Pa!
}
There is a scrap of paper nailed to the doorframe, written in a careful Italian hand.
"The half-coin for the man. Bring it to the ruined chapel at Kalkara when the moon is full. Come alone. — S."
NINU: Someone knows about the medallion. Someone who writes Italian and rides in an Armatura.
NINU: Hold on, Pa. I'm coming.
-> workshop

= workshop
>>> chapter "Chapter 1" "The Arsenal at Birgu · 20 May"
>>> stage p1-workshop
>>> actor kateri 4 2 south
>>> actor ninu 4 5 north
The militia is ordered back behind the walls of Birgu. In the Order's arsenal, the air is thick with oil smoke and the shriek of files on steel.
KATERI: Stop. Don't move. Your left knee spring is about to snap, and when it does it'll take your leg with it.
NINU: My leg is fine.
KATERI: The Armatura's leg, fisherman. Sit it down on the blocks. I'm Kateri Borg. My father built half the clocks in Mdina, and I keep the Order's frames walking.
She works quickly, humming, then stops and frowns at the gauge.
KATERI: Strange. The drive is reading higher than it should for a Ħaddiem. You're getting more out of it than the frame was built to give. How long have you been piloting?
NINU: Since the day before yesterday.
KATERI: Then either you're lying, or you're very unusual.
* [Tell her about Pa and the note]
    ~ aff_kateri += 1
    NINU: I don't care about unusual. Someone took my father. They left a note signed "S." and they want this.
    He shows her the half-medallion. She turns it to the light.
    KATERI: The cross of the Order on one face. And on the other... that's a tughra. An Ottoman seal. Who carries both?
    NINU: That's what I mean to find out.
* [Keep it to yourself]
    NINU: Just fix the knee. Please.
    KATERI: Fine. A man of mystery. Hold still.
- >>> actor luis 1 4 east
FRA LUIS: You are the militiaman who held the Marsaxlokk shore?
NINU: Ninu of Żejtun. Me and two friends.
FRA LUIS: Luis de Arrieta, of the langue of Aragon. The Grand Master needs the wells at the Marsa fouled before the Turk can drink from them. Our engineers need a screen of frames while they work. Yours will do.
* [Salute and accept]
    ~ aff_luis += 1
    ~ obeyed_orders += 1
    NINU: We'll hold them, sir.
    FRA LUIS: Good. Discipline wins sieges, not bravery.
* [Ask for help finding Pawlu in return]
    NINU: I'll go. But afterwards I need men to search for my father. He was taken.
    FRA LUIS: A thousand fathers will be taken before this is over, boy. Do your duty and I will see what can be done.
- KATERI: I'm coming too. If his knee goes out there, someone has to put it back.
FRA LUIS: A clockmaker's daughter?
KATERI: The best mechanic in this arsenal, with a Moschetta I rebuilt myself. You're welcome.
>>> join kateri
>>> prep
>>> battle b2-marsa-wells
-> after_wells

= after_wells
>>> stage p1-workshop
>>> actor ninu 4 5 north
>>> actor kateri 5 4 west
>>> actor luis 2 4 east
The wells are fouled with hemp and carrion before the first Ottoman water-carts arrive. It will be a thirsty summer on the Marsa.
FRA LUIS: You held when you were told to hold. That is rarer than courage.
NINU: Will you help me find my father now?
FRA LUIS: Tomorrow I lead a scouting sortie up Mount Sciberras. The Pasha is placing guns against St Elmo, and we must know where. Ride with me, and afterwards we will talk about your father.
KATERI: That's a yes, Ninu. From him that's practically a hug.
>>> join luis
>>> prep
>>> battle b3-sciberras
-> after_sciberras

= after_sciberras
>>> chapter "Chapter 2" "Across the Harbour · late May"
>>> stage p1-workshop
>>> actor ninu 4 5 north
>>> actor luis 3 3 south
FRA LUIS: The guns are where we feared. St Elmo will be battered night and day. It needs powder, men and frames, and the only way in is across the harbour, in the dark.
NINU: Under their cannon.
FRA LUIS: Under their cannon. The Grand Master asked for volunteers.
* [Volunteer at once]
    ~ aff_luis += 1
    NINU: Then I volunteer.
* [Ask about the chapel at Kalkara first]
    NINU: Sir, the note. The ruined chapel at Kalkara. Do you know it?
    FRA LUIS: I know it. And I know that a man who walks alone into a trap helps nobody. First St Elmo.
- KATERI: And I'm coming, before either of you asks.
>>> prep
>>> battle b4-night-crossing
-> st_angelo

= st_angelo
>>> stage p2-st-angelo
>>> actor valette 4 2 south
>>> actor luis 3 4 north
>>> actor ninu 5 4 north
The barges reach St Elmo, and the survivors row back before first light. Fra Luis brings Ninu to the upper ward of Fort St Angelo.
The Grand Master is past seventy. He stands like a man half that age, and his eyes miss nothing.
LA VALETTE: So this is the fisherman who pilots like a knight.
NINU: Your Eminence.
LA VALETTE: Fra Luis tells me your father was taken, and that the taker wants something you carry.
* [Show him the medallion]
    ~ showed_medallion = true
    ~ aff_valette += 1
    Ninu draws out the half-medallion. For a heartbeat the Grand Master does not breathe.
    LA VALETTE: Where did you get this?
    NINU: My father. Pawlu Falzon, of Żejtun. I've worn it all my life.
    LA VALETTE: Pawlu. Yes. Put it away, and keep it hidden. Whatever happens.
    NINU: That's... exactly what Pa always said.
    LA VALETTE: Then your father is a wise man. We will find him, if God allows.
* [Keep it hidden, as Pawlu asked]
    NINU: It's a family matter, Eminence. I'd rather not say.
    LA VALETTE: A man who can keep a secret. Good. Keep it well.
- LA VALETTE: Go. Rest while you can. The Turk has not yet begun in earnest.
>>> exit ninu luis
The Grand Master stays at the parapet long after they leave, watching the fires on the far shore.
LA VALETTE: Pawlu Falzon. After twenty-three years.
-> tigne

= tigne
>>> chapter "Interlude" "The Other Shore · early June"
>>> stage p3-camp
>>> actor deniz 3 4 north
>>> actor yusuf 4 3 west
Across the harbour, on the point below Mount Sciberras, the fleet's engineers are dragging guns into place.
YUSUF: Deniz! Turgut Reis wants a battery here by nightfall. The Maltese have been raiding our gun teams with their little frames.
DENIZ: Then we'll teach them to stay home, Father.
YUSUF: Captain, on duty. And don't be clever. The islanders fight like cornered cats.
DENIZ: Aye, Captain.
He grins, and his father almost grins back.
>>> join deniz
>>> join yusuf
>>> battle b5-tigne
-> leyla

= leyla
>>> stage p3-camp
>>> actor leyla 3 3 south
>>> actor deniz 4 5 north
The battery holds. That night Deniz goes to the tents of the pasha's household, where his mother serves the women of the Pasha's court.
LEYLA: You smell of powder.
DENIZ: We held Tigné. Turgut Reis himself said it was well done.
LEYLA: I heard. I also heard that the Maltese had frames among them. Young men, from the villages.
DENIZ: Farmers and fishermen in tin coats. They fought well enough.
She is quiet for a long moment. Then she opens her palm. In it lies half of a broken bronze medallion, the edge worn smooth by twenty-three years of her thumb.
DENIZ: What's that?
LEYLA: An old promise. Go and sleep, my son.
BALBI: So ends the first part of my account. The guns were in place. St Elmo would soon learn what the Turk could do.
-> act1
