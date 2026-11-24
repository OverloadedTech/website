import { mountOs } from "./os";
import { requestTerminal } from "./os/state";
import { countAge } from "./page/age";
import { birthday } from "./page/birthday";
import { throwCone } from "./page/cv";
import { startNav } from "./page/nav";
import { poke, watchPond } from "./page/pond";

// ?embed=1 = inside a kiosk/browser window, no OS in there
const embedded = new URLSearchParams(location.search).has("embed");

function onPage() {
  countAge();
  birthday();
  if (embedded) {
    for (const a of document.querySelectorAll<HTMLAnchorElement>("a[href^='http']"))
      a.target = "_blank";
  }
}

document.addEventListener("click", (e) => {
  const el = e.target as Element;
  if (el.closest(".escape")) {
    if (embedded) dispatchEvent(new Event("inception"));
    else requestTerminal();
  } else if (el.closest(".cv")) {
    throwCone(el.closest(".cv")!);
  } else if (el.closest(".poke")) {
    poke(el.closest(".poke")!, embedded);
  }
});

mountOs(document.getElementById("os")!, embedded);
if (!embedded) watchPond();
startNav(onPage);
onPage();
