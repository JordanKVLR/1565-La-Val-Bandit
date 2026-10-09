=== route_island ===
>>> chapter "The Island" "Chapter 7 · The Road to Mdina, early July"
>>> stage p0-zejtun
>>> actor ninu 3 4 north
>>> actor kateri 4 5 west
>>> actor ganni 2 5 east
Mdina, the old city on its hill, holds the island's cavalry and the last militia. Between it and Birgu lie Turkish patrols.
ĠANNI: You're alive! They said nobody came back from St Elmo.
NINU: Hardly anybody did. Is Rożi...?
ĠANNI: She's at Mdina already, shooting sipahis off the road. Come on. We'll go by the valleys.
>>> join ganni
>>> prep
>>> battle i1-road-to-mdina
-> zebbug

= zebbug
>>> chapter "Chapter 8" "The Wells of Żebbuġ · early July"
>>> stage i6-zebbug-wells
>>> actor ninu 2 8 north
>>> actor kateri 3 9 north
>>> actor ganni 3 8 north
>>> actor villager 1 4 east
Żebbuġ stands empty. Its people went behind the walls of Mdina in May, as the Grand Master ordered, and the wells of the countryside were fouled so that the Turk would find nothing to drink. Nearly all of them.
ĠANNI: There's someone in the square. An old man, in a frame older than he is.
VILLAGER: Militia? God be thanked. I'm Ċensu. I keep the well. Every night the women come down from Mdina to draw water and glean the last of the barley, and every night I keep watch.
VILLAGER: This morning the Turk's foragers found the threshing floor. They'll be back for the well, with barrels and riders.
KATERI: Why not foul it, like the others?
VILLAGER: It's the only sweet water between here and the Silent City. Foul it, and Mdina's children drink from cisterns gone green with summer. No. Better to hold it.
>>> actor rozi 3 3 east
ROŻI: Better to hold it. Ninu! I heard there were frames on the valley road, and I said, that'll be the fisherman. Too stubborn to die.
NINU: Rożi!
ROŻI: Hug me later. Riders, from the east, on the Qormi road.
* [Hold the well. Mdina needs it.]
    ~ helped_village = true
    NINU: Then we hold it. Ċensu, stay by the well-head and keep your head down.
    VILLAGER: I'll keep it down when they've gone, boy.
* [Tell Ċensu to run for Mdina]
    NINU: Ċensu, go. We'll hold them for you.
    VILLAGER: Sixty years I've drawn water here. I'm not running from a man on a horse.
- >>> prep
>>> battle i6-zebbug-wells
>>> stage i6-zebbug-wells
>>> actor ninu 3 4 east
>>> actor villager 2 4 east
>>> actor rozi 3 3 south
The foragers ride east with empty barrels. Ċensu lowers his bucket into the dark and brings it up full.
VILLAGER: Tell them in Mdina: the well of Żebbuġ is still sweet.
ROŻI: Come on. Captain Anastagi will want to meet the man who walked out of St Elmo.
-> mdina

= mdina
>>> chapter "Chapter 9" "The Silent City · late July"
>>> stage s-mdina
>>> actor ninu 4 4 north
>>> actor anastagi 4 2 south
>>> actor kateri 3 4 east
ANASTAGI: Captain Vincenzo Anastagi, of the Mdina horse. I hear you piloted at St Elmo. Good. Then you know what waiting looks like.
ANASTAGI: The Pasha has sent a column to test our walls. We have too few men, so we'll dress the townspeople as soldiers and line the ramparts, and fire every gun we own as if we had powder to waste.
KATERI: A bluff.
ANASTAGI: A bluff with frames behind it. That part is you.
>>> join anastagi
>>> prep
>>> battle i2-mdina-walls
-> marsa_raid

= marsa_raid
>>> chapter "Chapter 10" "The Raid · 7 August"
>>> stage s-mdina
>>> actor ninu 4 4 north
>>> actor anastagi 4 2 south
ANASTAGI: At dawn the Pasha throws everything at Birgu and Senglea. His camp at the Marsa will be empty but for the sick and the guards. We ride.
NINU: We attack the camp?
ANASTAGI: We burn the camp. He'll think the relief army has landed, and pull his men back from the breach. Every minute we buy is a life on those walls.
>>> prep
>>> battle i3-marsa-raid
-> hospital

= hospital
>>> chapter "Interlude" "Rearguard of the Sick · 7 August"
>>> stage i7-marsa-hospital
>>> actor deniz 5 3 south
>>> actor yusuf 6 4 south
At the head of the harbour, behind the Ottoman lines, the camp's sick lie under sailcloth by the springs of the Marsa. Fever and dysentery have filled the tents faster than the guns.
YUSUF: Every man who can stand is at the breach. They have left the sick to the cooks and the surgeons. And to us.
DENIZ: A navigator, guarding sickbeds. Turgut Reis would have laughed.
YUSUF: Turgut Reis is dead, and half these men rowed for him. Mind your tongue.
>>> actor janissary 4 3 south
JANISSARY: Captain! Riders from the west, and frames! They're firing the tents!
DENIZ: The relief army? From Sicily?
YUSUF: Or the Mdina horse, making the noise of an army. It doesn't matter which. Hold them off the tents until the sick are down at the shore. Nobody burns in his bed today.
>>> battle i7-marsa-hospital
>>> stage i7-marsa-hospital
>>> actor deniz 4 3 south
>>> actor yusuf 6 4 west
The raiders ride off as fast as they came, leaving smoke behind them. Across the harbour the Pasha's trumpets sound the recall, and the great assault on Birgu breaks off unfinished.
DENIZ: Did you see the frame that led them? White, with red and gold. I know that frame. Kalkara.
{aff_deniz > 0:
    DENIZ: The farmer who let me go. He was here, burning our tents, while I carried our sick out of them.
    YUSUF: And tonight he is telling his friends about the corsair he let live. War is a very small room, my son.
- else:
    DENIZ: The farmer who tried to put me in chains. He fights as if he owns this island.
    YUSUF: In a way, he does. We are the ones who must row home.
}
>>> actor leyla 3 2 south
That evening Leyla Hatun comes down from the pasha's household with water and clean linen, as the women of the household have done all summer.
LEYLA: You're hurt.
DENIZ: It's nothing. Mother, the Maltese in the white frame. Have you heard of him?
LEYLA: Ships' talk. A farmer from Żejtun, they say, who walked out of St Elmo alive.
She says nothing more. But her hand goes to the cord at her throat, where the half-medallion hangs, and stays there a long time.
-> letters

= letters
>>> chapter "Chapter 11" "Letters for Sicily · late August"
>>> stage s-mdina
>>> actor ninu 4 4 north
>>> actor anastagi 4 2 south
>>> actor rozi 5 3 west
>>> actor kateri 3 4 east
August burns on. In Birgu and Senglea the walls are more rubble than stone, and still the Viceroy of Sicily has not sailed.
ANASTAGI: The Governor has written to Don García again, and so has the Grand Master, by a man who swam the harbour to reach us. If these letters do not reach Sicily, there may be nobody left in Birgu to relieve.
ANASTAGI: A fishing boat will wait in Ġnejna Bay after dark. The Turk has galleys off that coast, and riders on the cliffs.
ROŻI: I'll take them. My uncle fished out of Ġnejna, I know every rock in that bay. And the Viceroy's men might listen to someone who has watched this island bleed.
NINU: If you go, you might not be able to come back.
ROŻI: Then I'll come back with the fleet. Keep a beach free for me.
KATERI: Ninu. The tents we burned at the Marsa. Ġanni says there were sick men in them.
NINU: I know. I saw a Levend frame carrying them out through the smoke. I think it was him. The corsair from Kalkara.
* [Say it doesn't change what you had to do]
    NINU: It doesn't change anything. Birgu was hours from falling.
    KATERI: I know. I just don't want us to stop noticing.
* [Say you're glad someone got them out]
    ~ aff_kateri += 1
    NINU: I'm glad he did. I'd want someone to do the same for ours.
    KATERI: There you are. I was afraid the war had eaten you.
- >>> prep
>>> battle i8-gnejna-bay
>>> stage i8-gnejna-bay
>>> actor ninu 4 3 west
>>> actor rozi 3 1 west
Rożi wades out to the boat with the letters wrapped in oilcloth above her head. The sail goes up, black against the stars, and turns north for Sicily.
NINU: Come back, Rożi.
ROŻI: Keep a beach free!
>>> exit rozi
-> mellieha

= mellieha
>>> chapter "Chapter 12" "Sails from Sicily · 7 September"
>>> stage p0-zejtun
>>> actor ninu 3 4 north
>>> actor kateri 4 4 west
>>> actor rozi 5 5 west
The relief army is landing at last, at Mellieħa in the north. Eight thousand men wade ashore, and the Turk sends frames to catch them on the beach.
ROŻI: I told you I'd come back with the fleet. Don García sends his compliments, and eight thousand men.
ROŻI: Scala's here. I saw his colours on the ridge above the bay from the deck. And a prisoner's cage on one of his wagons.
NINU: Pa.
>>> prep
>>> battle i4-mellieha-landing
-> naxxar

= naxxar
>>> chapter "Chapter 13" "Naxxar Ridge · 13 September"
>>> stage p0-zejtun
>>> actor ninu 3 4 north
>>> actor anastagi 5 3 west
>>> actor kateri 4 5 west
The Turk is leaving. But Mustafa Pasha, stung and furious, marches his army back ashore to fight the relief force one last time on the ridge near Naxxar. Scala marches with him.
ANASTAGI: This is where it ends, one way or another.
NINU: Then let's end it.
>>> prep
>>> battle i5-naxxar-ridge
>>> stage i5-naxxar-ridge
>>> actor ninu 5 4 north
>>> actor anastagi 6 4 north
>>> actor kateri 4 5 north
The colossus staggers, pouring steam, and the Turkish line breaks around it. But Scala does not fall. His machine limps north toward the sea, and the cage wagon rattles after it.
ANASTAGI: The whole army is running for the boats in St Paul's Bay. The Spanish will chase them all the way to the water.
NINU: Then so will we. Pa is in that cage.
-> st_pauls

= st_pauls
>>> chapter "Chapter 14" "St Paul's Bay · 13 September, evening"
>>> stage i9-st-pauls-bay
>>> actor ninu 5 8 north
>>> actor anastagi 6 8 north
>>> actor kateri 4 8 north
>>> actor scala 4 3 south
All the way down to St Paul's Bay the relief army harries the Turk, and the bay fills with boats pulling out to the galleys. The janissaries of the rearguard stand in the shallows to cover them, and they do not run.
KATERI: He's bolted the plates off his dead Prototipi onto it. It'll be slower. It'll also be angrier.
ANASTAGI: They say St Paul was shipwrecked in this bay, and the islanders were kind to him. I don't feel kind.
SCALA: Falzon! You could have been a prince! Now I'll sell your father in Algiers for the price of a mule!
NINU: You'll have to get him onto a boat first.
>>> prep
>>> battle i9-st-pauls-bay
>>> stage i9-st-pauls-bay
>>> actor ninu 4 4 north
>>> actor kateri 5 4 west
>>> actor pawlu 4 3 south
The colossus goes down in the shallows with a roar of steam. Scala crawls out of the wreck into the arms of a Spanish patrol. The Viceroy, it seems, has questions for a Genoese who sold war machines to the Sultan.
The last galleys row for the open sea. On the beach, Kateri breaks the lock of the cage with a spanner.
PAWLU: Ninu. You came.
NINU: I always come, Pa. It's the stubbornness. I get it from you.
PAWLU: Not from me, son. Not only from me. Help an old man up, and I'll tell you on the way home.
-> ending_island

= ending_island
>>> chapter "Epilogue" "The Island · September 1565"
>>> stage p0-zejtun
>>> actor ninu 3 4 north
>>> actor pawlu 5 4 west
>>> actor kateri 4 5 north
The Turk sails for home with the autumn wind. On the fields of Żejtun, the terraces are broken and the wells are fouled. But the soil is still there.
PAWLU: You could have gone to the Grand Master. Or to her. You could have been something grander than a farmer.
NINU: I am something grander than a farmer. I'm a Maltese farmer who beat an empire.
PAWLU: Ha! Your mother would have liked that answer.
NINU: Tell me about her, Pa. Everything. We have all winter.
{aff_kateri >= 2:
    KATERI: And once you've told him everything, he's coming to Mdina to help me rebuild my father's workshop. He owes me about forty knee springs.
    NINU: Forty-one.
}
BALBI: I have written this chronicle for the Knights, for the Viceroy, and for the Pope. But this last page is for the people of the island, who held on.
>>> chapter "Ending: The Island" "Thank you for playing"
>>> end
-> END
