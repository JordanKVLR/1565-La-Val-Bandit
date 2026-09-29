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
-> mdina

= mdina
>>> chapter "Chapter 8" "The Silent City · late July"
>>> stage s-mdina
>>> actor ninu 4 4 north
>>> actor anastagi 4 2 south
>>> actor kateri 5 4 west
ANASTAGI: Captain Vincenzo Anastagi, of the Mdina horse. I hear you piloted at St Elmo. Good. Then you know what waiting looks like.
ANASTAGI: The Pasha has sent a column to test our walls. We have too few men, so we'll dress the townspeople as soldiers and line the ramparts, and fire every gun we own as if we had powder to waste.
KATERI: A bluff.
ANASTAGI: A bluff with frames behind it. That part is you.
>>> join anastagi
>>> prep
>>> battle i2-mdina-walls
-> marsa_raid

= marsa_raid
>>> chapter "Chapter 9" "The Raid · 7 August"
>>> stage s-mdina
>>> actor ninu 4 4 north
>>> actor anastagi 4 2 south
ANASTAGI: At dawn the Pasha throws everything at Birgu and Senglea. His camp at the Marsa will be empty but for the sick and the guards. We ride.
NINU: We attack the camp?
ANASTAGI: We burn the camp. He'll think the relief army has landed, and pull his men back from the breach. Every minute we buy is a life on those walls.
>>> prep
>>> battle i3-marsa-raid
-> mellieha

= mellieha
>>> chapter "Chapter 10" "Sails from Sicily · 7 September"
>>> stage p0-zejtun
>>> actor ninu 3 4 north
>>> actor kateri 4 4 west
The relief army is landing at last, at Mellieħa in the north. Eight thousand men wade ashore, and the Turk sends frames to catch them on the beach.
KATERI: Scala's there. Rożi saw his colours on the ridge above the bay. And a prisoner's cage on one of his wagons.
NINU: Pa.
>>> prep
>>> battle i4-mellieha-landing
-> naxxar

= naxxar
>>> chapter "Chapter 11" "The Last Battle · 11 September"
>>> stage p0-zejtun
>>> actor ninu 3 4 north
>>> actor anastagi 5 3 west
>>> actor kateri 4 5 west
The Turk is leaving. But Mustafa Pasha, stung and furious, marches his army back ashore to fight the relief force one last time on the ridge near Naxxar. Scala marches with him.
ANASTAGI: This is where it ends, one way or another.
NINU: Then let's end it.
>>> prep
>>> battle i5-naxxar-ridge
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
