const { chromium } = require("playwright");
const player = require("play-sound")();
require("dotenv").config(); // Cargar las variables de entorno desde .env

const URL = process.env.URL;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:115.0) Gecko/20100101 Firefox/115.0";
const PROVINCIA = process.env.PROVINCIA;
const NOMBRE_DE_LA_SEDE = process.env.NOMBRE_DE_LA_SEDE;
const NOMBRE_TRAMITE = process.env.NOMBRE_TRAMITE;
const NUMERO_NIE = process.env.NUMERO_NIE;
const NOMBRE_Y_APELLIDOS = process.env.NOMBRE_Y_APELLIDOS;
const ANIO_DE_NACIMIENTO = process.env.ANIO_DE_NACIMIENTO;
const NACIONALIDAD = process.env.NACIONALIDAD;

(async () => {
  const browser = await chromium.launch({ headless: false });

  const context = await browser.newContext({ userAgent: USER_AGENT });

  const page = await context.newPage();

  // Iniciar el proceso desde la página 1
  await page.goto(URL);

  await page.getByRole("button", { name: "Acceder al procedimiento" }).click();

  await page.waitForLoadState("networkidle");
  await wait(4000);

  let noAppointments;

  // Bucle para intentar obtener cita
  do {
    noAppointments = await startProcess(page);

    if (noAppointments) {
      console.log("No hay citas disponibles. Repitiendo proceso...");

      // Hacer clic en el botón "Salir"
      await page.getByRole("button", { name: "Salir" }).click();

      // Esperar a que se cargue la página inicial
      await page.waitForLoadState("networkidle");
      await wait(3000);
    } else {
      console.log("Cita disponible, continúa el proceso...");

      // Reproduce el sonido de alarma cuando se detecta una cita disponible
      player.play("alarm.mp3", function (err) {
        if (err) throw err;
      });

      // Detener el bucle si hay citas disponibles
      break;
    }
  } while (noAppointments);

  await new Promise(() => {}); // Pausa para continuar el proceso manualmente si es necesario
  await browser.close();
})();

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startProcess(page) {
  // pagina 2
  const selectProvincia = page.locator('select[name="form"]');
  await selectProvincia.selectOption({ label: PROVINCIA });

  await page.getByRole("button", { name: "Aceptar" }).click();

  await page.waitForLoadState("networkidle");
  await wait(4000);

  // pagina 3
  const selectSede = page.locator('select[name="sede"]');
  await selectSede.selectOption({ label: NOMBRE_DE_LA_SEDE });

  await wait(2000);

  const selectTramite = page.locator('select[name="tramiteGrupo[0]"]');
  await selectTramite.selectOption({ label: NOMBRE_TRAMITE });

  await page.getByRole("button", { name: "Aceptar" }).click();

  await page.waitForLoadState("networkidle");
  await wait(4000);

  // pagina 4
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.waitForLoadState("networkidle");
  await wait(4000);

  // pagina 5
  await page.getByRole("textbox", { name: "N.I.E." }).fill(NUMERO_NIE);

  await page
    .getByRole("textbox", { name: "Nombre y apellidos" })
    .fill(NOMBRE_Y_APELLIDOS);

  await page
    .getByRole("spinbutton", { name: "Año de nacimiento" })
    .fill(ANIO_DE_NACIMIENTO);

  await page.selectOption("select#txtPaisNac", { label: NACIONALIDAD });

  await page.waitForLoadState("networkidle");
  await wait(4000);

  await page.getByRole("button", { name: "Aceptar" }).click();

  await page.waitForLoadState("networkidle");
  await wait(4000);

  // pagina 6
  await page.getByRole("button", { name: "Solicitar Cita" }).click();

  await page.waitForLoadState("networkidle");
  await wait(2000);

  // Verificar si el mensaje "En este momento no hay citas disponibles." está presente
  const noAppointments = await page.isVisible(
    "text=En este momento no hay citas disponibles."
  );

  return noAppointments;
}
