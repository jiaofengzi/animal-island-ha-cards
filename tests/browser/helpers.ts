import {expect,type Locator} from '@playwright/test';
/** Operate the real upstream Select, whose popup is adjacent to its combobox. */
export async function chooseOption(combobox:Locator,value:string){
 await combobox.click();
 const labels:Record<string,string>={one:'单曲循环',all:'全部循环',off:'关闭',normal:'标准',heat:'制热',on:'开启'};
 const wrapper=await combobox.evaluate(node=>node.tagName==='INPUT')?combobox.locator('..').locator('..'):combobox.locator('..');
 const popup=wrapper.getByRole('listbox');
 await expect(popup).toBeVisible();
 const exact=popup.getByRole('option',{name:value,exact:true});
 const option=await exact.count()?exact:popup.getByRole('option',{name:labels[value]??value,exact:true});
 await expect(option).toBeVisible();
 await option.click();
 await expect(combobox).toHaveAttribute('aria-expanded','false');
}
