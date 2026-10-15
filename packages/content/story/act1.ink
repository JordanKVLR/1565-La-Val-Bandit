=== act1 ===
>>> chapter "Chapter 3" "The Chapel at Kalkara · full moon, June"
>>> stage p1-workshop
>>> actor ninu 4 5 north
>>> actor kateri 5 4 west
The moon rises full over the harbour. Ninu checks his frame's springs for the third time.
KATERI: You're not going alone.
NINU: The note said alone.
KATERI: The note was written by a man who kidnaps farmers. I'm not taking orders from him. Neither are you.
NINU: Why do you care so much? A week ago you didn't know my name.
She wipes her hands on a rag for longer than they need.
KATERI: Last winter a Genoese came to Mdina, all smiles and velvet, and asked to see my father's workshop. My father showed him everything. He was proud of it.
KATERI: Papà died at Candlemas. A fever. Before he was cold, the Genoese had bought his debts and every drawing in the house. I came to Birgu with a toolbag and a grudge.
NINU: Scala.
KATERI: I didn't know his name until tonight's note had an S on it. I know his hand, though. I've seen it in the margins of my father's drawings.
KATERI: And I worked out your knee spring, by the way. You don't drive a frame, you haul it, the way you'd haul a net, feeling for the strain before it comes. Nobody teaches that in an arsenal. You learned it in a boat.
NINU: Pa taught me. He said a net tells you everything if you keep your hand on the line.
KATERI: Then keep your hand on the line tonight.
* [Let her come]
    ~ aff_kateri += 1
    NINU: All right. Stay behind me, and if it goes wrong, run.
    KATERI: If it goes wrong, I'll be the one telling you to run.
* [Insist she stays]
    NINU: If something happens to me, someone has to tell Fra Luis where I went.
    KATERI: Then I'll tell him from ten paces behind you. Stop arguing.
- -> kalkara

= kalkara
>>> stage b6-kalkara-chapel
>>> actor ninu 5 8 north
>>> actor kateri 4 9 north
>>> actor scala 5 2 south
>>> actor deniz 4 3 south
The chapel at Kalkara was burned by corsairs long ago. Its roof is open to the sky. Waiting inside is an Armatura like none Ninu has seen, all brass ribs and hissing valves. Its pilot's hatch stands open.
SCALA: Punctual. And not alone. I did say alone, but young men never listen. I was the same.
NINU: Where is my father?
SCALA: Safe, fed, and a good deal more talkative than he was twenty years ago. Vittorio Scala, engineer. I built the frame you're standing in, or at least its grandfather.
SCALA: Give me the half-coin, and Pawlu Falzon walks home tonight.
NINU: What is it to you? It's a broken bit of bronze.
SCALA: To you, perhaps. To certain people in Birgu and in Constantinople, it is a key. I sell to both sides, boy. I intend to sell this too.
A young corsair steps forward in a light Levend frame, a curved blade at his hip.
DENIZ: Signore, you said this would be a simple exchange.
SCALA: It is, Deniz. He gives, I take. Take it from him.
DENIZ: ...I don't like this. But a debt is a debt.
>>> battle b6-kalkara-chapel
-> after_kalkara

= after_kalkara
>>> stage b6-kalkara-chapel
>>> actor ninu 5 5 north
>>> actor kateri 4 6 north
>>> actor deniz 6 3 south
Scala's machine retreats into the dark, whistling steam. The young corsair is down on one knee in his broken frame.
DENIZ: Go on, then. Finish it.
NINU: You fight well for a pirate.
DENIZ: You fight well for a farmer.
For a moment they look at each other. There is something about his face, the line of the jaw perhaps, that Ninu cannot place.
* [Let him go]
    ~ aff_deniz += 1
    NINU: Go. Tell your engineer friend that the next time he wants something from me, he can ask me himself.
    DENIZ: ...Deniz. My name is Deniz. I owe you one, farmer.
    NINU: Ninu. And you do.
* [Take him prisoner]
    NINU: You're coming to Birgu. The Grand Master will want to question you.
    DENIZ: Then he'll be disappointed.
    Before Ninu can reach him, Deniz rolls off the chapel wall into the harbour and is gone in the dark water.
    KATERI: Well. That went well.
- >>> exit deniz
>>> actor luis 6 8 north
FRA LUIS: I followed the pair of you. I saw the Genoese. Scala, yes? I know that name from Rhodes and Tripoli. Wherever there is a war, he has something to sell.
NINU: He knows about Pa. He knows about this. He said it's a key.
FRA LUIS: Then keep it close, and say no more of it tonight. St Elmo needs every frame. We sail tomorrow.
>>> join luis
-> the_cage

= the_cage
>>> chapter "Interlude" "The Cage · the same night"
>>> stage p3-camp
>>> actor pawlu 3 3 south
>>> actor scala 4 5 north
In a workshop tent below Mount Sciberras, among crates stamped with the marks of Genoa and Venice and Constantinople alike, an old fisherman sits in an iron cage and watches the door.
SCALA: Your boy came, Pawlu. With a clockmaker's daughter and a temper. He broke my best Levend and its pilot, then let the pilot go. Sentimental. He gets that from you.
PAWLU: He gets nothing from me. That's what I've been trying to tell you.
SCALA: Oh, I know. That was rather the point of all those drinks you bought me in Birgu last winter. A man who has kept a secret for twenty years gets very thirsty around Candlemas.
PAWLU: I never told you anything.
SCALA: You told me "the boy's mother had a prince's eyes," and then you wept into your wine. An engineer learns to build a whole machine from one bolt.
Scala sets a lamp on the crate and unrolls a drawing: half a bronze coin, sketched from memory. A cross on one face; on the other, the looping seal of an Ottoman prince.
SCALA: Struck on Rhodes, wasn't it, when the Knights kept Prince Cem's grandchildren as their guests? Two halves, one for each side of a family that could never meet. Join them, and you have proof no court on either shore could ignore. That is what a key is, Pawlu. It opens doors that should stay shut.
PAWLU: Then leave the boy alone and break the thing yourself.
SCALA: Break it? My friend, I mean to sell the door.
He blows out the lamp. In the dark the old fisherman closes his eyes and sees a galley's bench, a chained knight beside him, and a woman's face at a stern window.
PAWLU: Hold on, son. Don't come for me. Please don't come.
-> st_elmo

= st_elmo
>>> chapter "Chapter 4" "Fort St Elmo · mid June"
>>> stage p2-st-angelo
>>> actor ninu 4 4 north
>>> actor luis 3 3 south
>>> actor balbi 5 3 west
St Elmo is a star of stone at the tip of the peninsula. The Turkish guns on Sciberras pound it from dawn to dusk. By night boats slip across from Birgu with powder, water and fresh men, and take back the wounded.
BALBI: Balbi, of Correggio. Arquebusier, and in my spare moments, a writer of diaries. Welcome to the anvil, gentlemen.
NINU: You're writing about this?
BALBI: Someone must. The Turk will write that he took a little fort in a week. I intend to write down the truth, which is that it cost him a month and his best captains.
FRA LUIS: The ravelin is the weak point. If it falls, they are at our gates. We hold it tonight.
>>> join balbi
>>> prep
>>> battle b7-st-elmo-ravelin
-> turgut

= turgut
>>> chapter "Interlude" "The Admiral's Battery · 18 June"
>>> stage p3-camp
>>> actor deniz 3 4 north
>>> actor yusuf 4 3 west
>>> actor turgut 5 2 south
{aff_deniz > 0:
    DENIZ: Father, the farmer who beat me at Kalkara let me go. He could have killed me.
    YUSUF: Then he was either a fool or a good man. On this island, I'm not sure there is a difference.
- else:
    DENIZ: Father, the Maltese at Kalkara tried to take me in chains. I got away.
    YUSUF: Next time, stay away from Scala's errands. That man's debts are poison.
}
TURGUT: Yusuf Reis! Your boy is the one who held Tigné?
YUSUF: He is, Admiral.
TURGUT: Good. I am placing new guns on the ridge above the fort. The knights sally out every night to spike them. Keep them off my gunners until the morning.
The old admiral is eighty years old. He has fought on every coast of the sea, and he stands in the open as if cannon balls were rain.
TURGUT: You know who holds that fort's island, boy? Jean de Valette. Twenty-five years ago the Genoese had me chained to an oar, and a young knight came down to the benches to look at me. "Usanza de guerra," he said. The custom of war.
TURGUT: A year later he was chained to an oar in one of our galleys, and I told him: "Y mudanza de fortuna." And the turning of fortune. I have liked him ever since. I would still like to take his island.
YUSUF: Was there not a woman aboard that summer, Admiral? From the household of Cem's line?
TURGUT: There was. And a Maltese oarsman who looked at her like a dog at the moon. Old stories, Yusuf. Gunners first.
Yusuf says nothing more, but he looks at his son for a long moment.
DENIZ: At once, Admiral.
>>> battle b8-turgut-battery
-> turgut_falls

= turgut_falls
>>> stage p3-camp
>>> actor deniz 3 4 north
>>> actor yusuf 4 4 north
A shot from St Elmo strikes the rock beside the battery. A splinter of stone flies, and the admiral falls.
Turgut Reis is carried to his tent. He will not live to see the fort taken.
YUSUF: The best seaman of our age, killed by a chip of Maltese rock.
DENIZ: Then we'll take the fort for him.
YUSUF: Deniz... There will be no glory in what comes next. Only digging, and dying.
-> fall_of_st_elmo

= fall_of_st_elmo
>>> chapter "Chapter 5" "The Fall of St Elmo · 23 June"
>>> stage b9-fall-of-st-elmo
>>> actor ninu 7 3 west
>>> actor luis 8 4 west
>>> actor balbi 7 5 west
The walls of St Elmo are gone. What remains is a ring of rubble, held by men and frames who cannot stand.
FRA LUIS: The Grand Master has sent no more boats. He cannot. We hold to the end.
NINU: Then we hold.
FRA LUIS: No. Not you.
He grips Ninu's shoulder. There is something new in his voice.
FRA LUIS: There is a skiff in the rocks below the west wall. You will take it, and you will live. That is an order.
NINU: Why me? Why not Balbi, or the wounded?
FRA LUIS: Because you are the Grand Master's son.
NINU: What?
FRA LUIS: He was a slave on a corsair galley, twenty-three years ago. There was a woman there, of the Ottoman household, and of blood higher than any of ours. You are the child of that. Pawlu Falzon carried you home.
FRA LUIS: She was of Prince Cem's line, the Ottoman prince the Knights sheltered on Rhodes. She broke that medallion in two on the day you were born, and kept the other half. The last we heard, she was in the household of the Turkish fleet. She may be across this harbour tonight.
FRA LUIS: Scala knows. That is why he wants you. A son of the Order's Grand Master, with a claim of Ottoman blood, is worth more than a hundred guns to the man who owns him.
NINU: I don't... Pa never...
FRA LUIS: Pawlu kept his oath. So did I. Now go to the boat. Take Balbi. Someone must write this down.
>>> battle b9-fall-of-st-elmo
-> crossroads

= crossroads
>>> chapter "Chapter 6" "Three Roads · late June"
>>> stage p2-st-angelo
>>> actor ninu 4 4 north
>>> actor kateri 5 5 west
>>> actor balbi 3 5 east
St Elmo has fallen. The Turk floats the bodies of its defenders across the harbour on wooden crosses. The Grand Master answers with cannon.
Fra Luis did not come back.
>>> leave luis
KATERI: Ninu. Talk to me.
NINU: He told me who I am. And then he stayed, so that I could go.
BALBI: I wrote his name down. I'll write it down again, in a better book, when this is over.
{showed_medallion:
    KATERI: The Grand Master saw your medallion. He knew. He must have.
- else:
    KATERI: Does the Grand Master know you know?
}
NINU: Scala still has Pa. He said the medallion is a key, and the other half is out there, with my mother. In the Turk's own camp.
KATERI: So what do we do?
Ninu turns the half-coin over and over in his fingers.
* [Stand with the Order. Go to the Grand Master.]
    ~ route = "cross"
    NINU: I'll go to him. Not as his son. As a soldier of Birgu. If he wants to say more, that's his choice.
    -> route_cross
* [Fight as a Maltese. Go to Mdina with the militia.]
    ~ route = "island"
    NINU: I'm not a knight and I'm not a prince. I'm from Żejtun. I'll fight for the island, from Mdina.
    -> route_island
* {aff_deniz > 0} [Find the other half. Cross to the Ottoman camp.]
    ~ route = "crescent"
    NINU: The corsair, Deniz. He said he owed me one. I'm going to collect, and I'm going to find my mother.
    KATERI: That is the worst idea you've ever had. I'm coming.
    -> route_crescent
