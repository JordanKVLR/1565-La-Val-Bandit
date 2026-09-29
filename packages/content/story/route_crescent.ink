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
-> galleys

= galleys
>>> chapter "Chapter 9" "The Galleys of Marsamxett · late July"
>>> stage b8-turgut-battery
>>> actor yusuf 4 3 south
>>> actor deniz 4 5 north
>>> actor ninu 5 5 north
YUSUF: So. The farmer is your brother, and your mother is to be hanged for a spy. You have had a busy week, my son.
DENIZ: Father, please.
YUSUF: I raised you. I will not stop now. Scala keeps his machines on two galleys in Marsamxett. Burn them, and his lies burn with them. I will speak to the Pasha.
>>> join yusuf
>>> prep
>>> battle c2-marsamxett-galleys
-> tribunal

= tribunal
>>> chapter "Chapter 10" "The Pasha's Tent · August"
>>> stage p3-camp
>>> actor mustafa 3 2 south
>>> actor leyla 3 4 north
>>> actor scala 5 3 west
MUSTAFA: Leyla Hatun. The Genoese says you have been sending word to the Knights.
LEYLA: The Genoese sells to the Knights, Pasha. Ask him whose frames hold St Angelo.
SCALA: A clever tongue. She's a Christian knight's woman, Pasha. I have proof.
MUSTAFA: I have no time for this. We lose a thousand men a day. Hold her until the siege is done.
The Pasha's guards close in. It is time to leave.
>>> battle c3-pasha-tribunal
-> corradino

= corradino
>>> chapter "Chapter 11" "Corradino Heights · early September"
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
>>> chapter "Chapter 12" "The Broken Medallion · 8 September"
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
-> ending_crescent

= ending_crescent
>>> chapter "Epilogue" "Two Halves · September 1565"
>>> stage p0-zejtun
>>> actor ninu 3 4 north
>>> actor deniz 4 4 west
>>> actor leyla 4 3 south
>>> actor pawlu 2 4 east
The fleet sails on the twelfth of September. Yusuf Reis's galley waits offshore for one last passenger.
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
