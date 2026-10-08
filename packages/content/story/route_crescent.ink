=== route_crescent ===
>>> chapter "The Crescent" "Chapter 7 · Across the Water, early July"
>>> stage p3-camp
>>> actor ninu 3 5 north
>>> actor kateri 2 5 north
>>> actor deniz 4 3 south
They cross by night in a fishing boat. Deniz is waiting at the rocks below the Ottoman camp, as he promised in the message Ninu sent by a Maltese slave.
DENIZ: I said I owed you one. I didn't say I'd be happy to pay it.
NINU: I'm looking for a woman. She would be in a pasha's household. She wears half a medallion like this one.
Ninu shows him. Deniz goes very still.
DENIZ: Where did you get that?
NINU: I've always had it.
DENIZ: My mother has the other half. She's never told me what it means.
They look at each other for a long time: the jaw, the eyes, the stubborn set of the mouth.
KATERI: Oh. Oh, you two. You don't see it, do you?
DENIZ: See what?
KATERI: You're brothers, you idiots.
>>> join deniz
>>> actor scala 6 2 west
SCALA: How touching. And how convenient. Both halves of my inheritance, in one tent. Guards!
>>> battle c1-marsa-camp
-> leyla_meeting

= leyla_meeting
>>> chapter "Chapter 8" "The Other Half · July"
>>> stage p3-camp
>>> actor leyla 3 3 south
>>> actor ninu 3 5 north
>>> actor deniz 4 5 north
LEYLA: I prayed every day for twenty-three years that you would never come here.
NINU: I'm sorry.
LEYLA: No. Don't be sorry. Let me look at you.
She places her half of the medallion beside his. The two broken edges fit exactly: the cross of the Order and the seal of a prince, joined.
LEYLA: Your father was a slave on my master's galley, and I was a slave in my master's house, though a slave in silks. I am of the line of Prince Cem. That means nothing and everything. Cem's line are exiles, and dangerous to know.
LEYLA: A child of mine and a knight of Malta would have been killed, or worse, used. So I gave you to Pawlu, and I kept Deniz, and I have lived with both choices.
DENIZ: You never told me I had a brother.
LEYLA: I never told anyone. Somehow Scala found out anyway.
* [Embrace her]
    ~ aff_deniz += 1
    Ninu does not know what to say, so he says nothing, and holds his mother for the first time.
* [Ask why Scala wants you both]
    NINU: What does Scala want with us?
    LEYLA: A pretender. A boy with Valette's blood and Cem's, to be sold to whoever will pay the most to make trouble for the Order or for the Sultan. You are worth a war to a man like him.
- LEYLA: He has already told the Pasha I am a spy. They will come for me by morning.
>>> join leyla
-> boats

= boats
>>> chapter "Chapter 9" "The Boat Road · mid-July"
>>> stage c6-boat-road
>>> actor deniz 5 4 east
>>> actor leyla 6 5 west
>>> actor ninu 4 4 east
>>> actor kateri 4 5 east
The Pasha wants boats inside the Grand Harbour, but the guns of St Angelo hold its mouth. So the fleet's sailors carry them overland instead: some eighty boats, hauled over the neck of Mount Sciberras on greased timbers, a thousand men on the ropes.
Deniz knows the harbour soundings better than any pilot in the fleet, and he has been ordered to guide the boats down to the water. Leyla's household hides among the haulers, where Scala's accusations cannot easily find them.
DENIZ: Tomorrow every one of these boats goes against Senglea, full of men. Some of them I have known since I was twelve.
NINU: I won't pull a rope that drags a boat at Senglea, Deniz. I can't.
DENIZ: I'm not asking you to. I'm asking you to keep my mother alive while I do my job.
LEYLA: Our mother.
KATERI: Lovely family moment. Now look at the scrub on the ridge. Those men aren't haulers.
Men dressed as Maltese militia are closing in through the garigue, ahead of them and behind, and a Prototipo walks with them. Scala's hirelings. If Leyla dies here, the whole camp will say her Christian friends came for her.
* [Stand with Deniz on the road]
    ~ aff_deniz += 1
    NINU: Back to back, then. That's what brothers do, I suppose.
    DENIZ: How would either of us know?
* [Stand in front of Leyla]
    NINU: Stay behind me.
    LEYLA: I have stood behind men for twenty-three years. Not today.
- The haulers drop their ropes and run. Deniz draws his kilij.
>>> prep
>>> battle c6-boat-road
The next morning they watch from the ridge as the boats row out against the palisade of Senglea. Halfway across, a battery hidden at the waterline below St Angelo fires into them at point-blank range. Boat after boat goes down. Very few of the men aboard come back.
DENIZ: I charted that water. I told them where to row.
NINU: You didn't put the guns there.
DENIZ: No. Your side did. Are you glad?
NINU: I should be. Those are Senglea's walls. I'm not.
LEYLA: Grief is not treason, my sons. Not on either shore.
-> galleys

= galleys
>>> chapter "Chapter 10" "The Galleys of Marsamxett · late July"
>>> stage b8-turgut-battery
>>> actor yusuf 4 3 south
>>> actor deniz 4 5 north
>>> actor ninu 5 5 north
YUSUF: So. The farmer is your brother, and your mother is to be hanged for a spy. You have had a busy month, my son.
DENIZ: Father, please.
YUSUF: I raised you. I will not stop now. Scala keeps his machines on two galleys in Marsamxett. Burn them, and his lies burn with them. I will speak to the Pasha.
>>> join yusuf
>>> prep
>>> battle c2-marsamxett-galleys
-> hospital

= hospital
>>> chapter "Chapter 11" "The Hospital Tents · 7 August"
>>> stage c7-marsa-hospital
>>> actor leyla 6 6 west
>>> actor yusuf 4 4 west
>>> actor ninu 6 4 west
>>> actor deniz 7 6 west
>>> actor kateri 8 4 west
The Pasha has not yet answered Yusuf. While they wait, Leyla's household works where nobody asks questions: the hospital tents at the head of the Marsa, where the sick and wounded of ten weeks of siege lie in rows.
At dawn on the seventh of August the whole army goes against Birgu and Senglea at once. The camp empties of everyone who can stand.
LEYLA: Water for this row, Kateri. Then find the surgeon. The boy at the end will not see noon without him.
KATERI: He keeps saying the same word over and over. What does it mean?
LEYLA: It means "mother". Tell him she is coming. It is what I would want someone to tell mine.
Dust rises on the Mdina road. Horsemen in armaturas, a great many of them, riding hard for the camp.
NINU: Those are Mdina colours. Anastagi's cavalry. They'll burn the camp, so the Pasha thinks the relief has landed and pulls his men off the walls.
YUSUF: Clever. It will work, too. And these tents are the first thing in their way.
KATERI: Ninu. Those are our people.
NINU: I know. And these men can't stand up.
* [Hold the tents]
    NINU: Then we hold. Break their frames, not their bones. Nobody dies today who doesn't have to.
* [Call out to the riders in Maltese]
    NINU: Ħbieb! Friends! There's nobody here but the sick!
    The lead rider hears a Maltese voice from an Ottoman tent, and lowers his lance anyway.
    SOLDIER: A renegade! Ride him down!
    NINU: Well. I tried.
- YUSUF: When the army sees the smoke, it will come back. Until then, we are the army.
>>> prep
>>> battle c7-marsa-hospital
Horns sound along the siege lines. The army is streaming back across the Marsa at a run, certain that the relief from Sicily has landed, and the great assault that came within a breath of taking Senglea is called off.
The riders wheel away toward Mdina. Behind them these tents still stand. Not every part of the camp was so lucky.
DENIZ: Everyone on the walls of Senglea lives to see tomorrow because someone raided a hospital.
NINU: And everyone in these tents lives because we stood in front of it. I don't know what side that puts us on.
LEYLA: The side of the living. It is a small side, in a war. Hold on to it.
-> tribunal

= tribunal
>>> chapter "Chapter 12" "The Pasha's Tent · August"
>>> stage p3-camp
>>> actor mustafa 3 2 south
>>> actor leyla 3 4 north
>>> actor scala 5 3 west
MUSTAFA: Leyla Hatun. The Genoese says you have been sending word to the Knights.
LEYLA: The Genoese sells to the Knights, Pasha. Ask him whose frames hold St Angelo.
SCALA: A clever tongue. She's a Christian knight's woman, Pasha. I have proof.
MUSTAFA: My surgeons tell me your household stood in front of the hospital tents when the riders came. For that, you have my thanks.
MUSTAFA: But I have no time for this. We lose a thousand men a day. Hold her until the siege is done.
The Pasha's guards close in. It is time to leave.
>>> battle c3-pasha-tribunal
-> trenches

= trenches
>>> chapter "Chapter 13" "Turned on Their Makers · late August"
>>> stage c8-castile-trenches
>>> actor ninu 5 8 north
>>> actor deniz 4 8 north
>>> actor leyla 3 8 north
>>> actor kateri 6 8 north
>>> actor yusuf 7 8 north
For two weeks they are hunted by the Pasha's guard, hiding by day among the water-carriers and the slaves of the camp.
Before the post of Castile the Ottoman sappers dig day and night, driving their mines toward the bastion. Scala's great siege tower stands among their trenches. Tonight its guns point the wrong way.
KATERI: Look at the gunports. They're open on the south side. He's aiming down the Ottoman sap.
YUSUF: The Genoese smells the wind. The relief is coming and the army is dying of fever, so he means to arrive at the Grand Master's door with a gift: the Pasha's miners, dead in their own ditch.
DENIZ: And the two of us with a ribbon round our necks, no doubt.
LEYLA: There are three hundred men in that trench. Boys from Konya and Sarajevo and Trabzon, who have never heard Scala's name.
DENIZ: Their officers would hang us on sight, Mother.
LEYLA: Yes. And we are going to save them anyway.
* [Agree with Leyla]
    ~ aff_deniz += 1
    NINU: She's right. If we only save the people who'd save us, we're no better than Scala.
    DENIZ: You sound like her. It's unbearable.
* [Ask Kateri how to stop the tower]
    NINU: Kateri. Can we bring that thing down?
    KATERI: It's a tower on wheels with a boiler in its belly. Break the legs and it falls. Simple. Getting close is the hard part.
- In the sap below, an officer of the miners, mud to the elbows, sees the tower's guns turn toward his men. Then he sees the fugitives. He picks up his tüfek and climbs out to stand with them.
JANISSARY: I don't know who you are. I know whose ditch that is.
>>> prep
>>> battle c8-castile-trenches
The tower burns through the night, lighting the faces of three hundred men climbing out of a trench that was nearly their grave.
JANISSARY: None of us saw you tonight. Not one.
JANISSARY: The Genoese ran for the heights of Corradino with his last machines. There was an old Maltese in chains on one of his wagons.
NINU: Pa.
-> corradino

= corradino
>>> chapter "Chapter 14" "Corradino Heights · early September"
>>> stage p3-camp
>>> actor ninu 3 4 north
>>> actor deniz 4 4 north
>>> actor leyla 3 3 south
>>> actor kateri 2 4 east
The Ottoman army is sick, hungry and beaten. The relief force from Sicily is coming. Scala knows his market is closing, and he has fled up to the heights of Corradino with his last machines, and with Pawlu.
NINU: He'll try to sell us to whoever wins. Or kill us all, if nobody's buying.
DENIZ: Then we take Pawlu back before either happens. Together.
>>> prep
>>> battle c4-corradino-heights
-> medallion

= medallion
>>> chapter "Chapter 15" "The Broken Medallion · 8 September"
>>> stage b6-kalkara-chapel
>>> actor ninu 5 6 north
>>> actor deniz 4 6 north
>>> actor scala 5 2 south
In the ruins of the chapel at Kalkara, where it began, Scala makes his last stand in his colossus.
SCALA: You could have been kings, both of you! I offered you a throne!
NINU: You offered us a leash.
DENIZ: And we don't wear leashes.
>>> prep
>>> battle c5-broken-medallion
-> last_boat

= last_boat
>>> chapter "Chapter 16" "The Last Boat · 13 September"
>>> stage c9-st-pauls-bay
>>> actor piali 6 3 west
>>> actor yusuf 5 4 east
>>> actor leyla 3 4 east
>>> actor ninu 3 3 east
>>> actor deniz 4 4 east
The siege is over. On the eighth of September the army burned its camp and marched to the ships. Then the Pasha, told that the relief army was smaller than feared, landed again at St Paul's Bay and marched inland to fight it.
This morning the army came back down the hill at a run. Now all of it is trying to get into the boats at once, with the Spaniards close behind.
PIALI: Captain Yusuf. My galleys take off the army until dusk, and not one hour longer. The Pasha may stay and argue with the Spaniards if he likes. I will not lose the Sultan's fleet as well as his army.
YUSUF: And my passengers, Pasha?
PIALI: Your son sent me the Genoese's papers from Corradino. I have read them. Leyla Hatun is no spy. She is only inconvenient, which at court is worse.
PIALI: Get her aboard before dusk, and I never saw her.
>>> exit piali
The way to Yusuf's longboat runs along the beach. Hüsrev Aga, captain of the Pasha's guard, is standing in it with his men, and more of the guard are coming down the hill behind.
JANISSARY: Leyla Hatun. I stood guard in the Pasha's tent when the Genoese talked. I heard what the boy is.
JANISSARY: I have served the Sultan for thirty years. I know what one prince of the blood can cost: brothers killing brothers, whole provinces burned. Prince Cem's war was over before I was born, and my grandfather still woke up shouting about it.
JANISSARY: Give me the boy, and the rest of you may board.
DENIZ: He is my brother.
JANISSARY: That is exactly what I am afraid of.
* [Tell him you want no throne]
    NINU: I don't want a throne. I want to go home and mend nets.
    JANISSARY: I believe you. I also know that the men who want no throne are the ones others put on one.
* [Stand in front of your mother]
    ~ aff_deniz += 1
    Ninu steps in front of Leyla. Without a word, Deniz steps in beside him.
    JANISSARY: Both of you. Of course.
- LEYLA: Then you will have to go through his mother, Aga. And his brother. Choose.
>>> prep
>>> battle c9-st-pauls-bay
Hüsrev Aga's armatura lies on its side in the shallows. He does not try to rise.
JANISSARY: Go, then. Pray that I was wrong about you, boy. I will pray it too.
-> ending_crescent

= ending_crescent
>>> chapter "Epilogue" "Two Halves · September 1565"
>>> stage c9-st-pauls-bay
>>> actor ninu 7 2 north
>>> actor deniz 8 2 west
>>> actor leyla 8 1 south
>>> actor pawlu 6 2 east
By dusk the last of the army is aboard, and the fleet stands out to sea. Yusuf Reis's longboat waits in the shallows for one last passenger.
LEYLA: The medallion should stay in one piece now. You keep it.
NINU: No. Keep it broken. Half for Malta, half for you. Then there's always a reason to come back.
PAWLU: Wise boy. I wonder where he gets it from.
DENIZ: When this war is forgotten, brother, I'll sail into Marsaxlokk with a hold full of figs and no guns at all.
NINU: And I'll be on the shore, mending nets, pretending not to watch for your sails.
{aff_deniz >= 3:
    DENIZ: Brothers. I still can't believe it.
    NINU: Neither can I. Go home, Deniz. Take care of her.
}
BALBI: This part I did not write in my chronicle. Some things belong to the people who lived them.
>>> chapter "Ending: Two Halves" "Thank you for playing"
>>> end
-> END
